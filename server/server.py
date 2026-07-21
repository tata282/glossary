#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物流关务术语库 - 本地开发服务器
支持手机号+验证码登录（开发模式：验证码直接返回）
"""

import http.server
import json
import hashlib
import secrets
import os
import re
import urllib.parse
import random
from datetime import datetime

# ========== 配置 ==========
HOST = '0.0.0.0'
PORT = 8080
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
SESSIONS = {}
CODES = {}

# ========== 初始化 ==========
os.makedirs(DATA_DIR, exist_ok=True)

# ========== 工具函数 ==========
def get_user_file(phone):
    safe = re.sub(r'[^\w]', '_', phone)
    return os.path.join(DATA_DIR, f'{safe}.json')

def load_json(filepath, default=None):
    if not os.path.exists(filepath):
        return default if default is not None else {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default if default is not None else {}

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_users():
    return load_json(USERS_FILE, {})

def save_users(users):
    save_json(USERS_FILE, users)

def get_user_data(phone):
    filepath = get_user_file(phone)
    return load_json(filepath, {'terms': [], 'categories': ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用']})

def save_user_data(phone, data):
    filepath = get_user_file(phone)
    save_json(filepath, data)

def check_auth(headers):
    auth = headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
        return SESSIONS.get(token)
    cookie = headers.get('Cookie', '')
    for item in cookie.split(';'):
        item = item.strip()
        if item.startswith('token='):
            token = item[6:]
            return SESSIONS.get(token)
    return None

def send_json(response, data, status=200):
    response.send_response(status)
    response.send_header('Content-Type', 'application/json; charset=utf-8')
    response.send_header('Access-Control-Allow-Origin', '*')
    response.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    response.send_header('Content-Length', str(len(body)))
    response.end_headers()
    response.wfile.write(body)

def read_body(request):
    length = int(request.headers.get('Content-Length', 0))
    if length > 0:
        body = request.rfile.read(length)
        return json.loads(body.decode('utf-8'))
    return {}

# ========== API 处理 ==========
class GlossaryHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f'[{timestamp}] {args[0]}')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 静态文件
        if path == '/' or path == '/index.html':
            self.serve_static('index.html', 'text/html'); return
        if path == '/styles.css':
            self.serve_static('styles.css', 'text/css'); return
        if path == '/app.js':
            self.serve_static('app.js', 'application/javascript'); return

        # API
        if path == '/api/check-auth':
            phone = check_auth(self.headers)
            if phone:
                users = load_users()
                user = users.get(phone, {})
                send_json(self, {'authenticated': True, 'phone': phone, 'displayName': user.get('displayName', phone[:3] + '****' + phone[-4:])})
            else:
                send_json(self, {'authenticated': False}, 401)
            return

        if path == '/api/terms':
            phone = check_auth(self.headers)
            if not phone:
                send_json(self, {'error': '未登录'}, 401); return
            data = get_user_data(phone)
            send_json(self, data)
            return

        send_json(self, {'error': '未找到'}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 发送验证码
        if path == '/api/send-code':
            body = read_body(self)
            phone = body.get('phone', '').strip()
            if not phone or not re.match(r'^1[3-9]\d{9}$', phone):
                send_json(self, {'error': '请输入有效的手机号'}, 400); return
            code = str(random.randint(100000, 999999))
            CODES[phone] = code
            print(f'  [验证码] {phone} -> {code}')
            send_json(self, {'success': True, 'message': '验证码已发送', 'code': code})
            return

        # 验证码登录
        if path == '/api/verify-login':
            body = read_body(self)
            phone = body.get('phone', '').strip()
            code = body.get('code', '').strip()
            if not phone or not re.match(r'^1[3-9]\d{9}$', phone):
                send_json(self, {'error': '请输入有效的手机号'}, 400); return
            if not code or not re.match(r'^\d{6}$', code):
                send_json(self, {'error': '请输入6位验证码'}, 400); return
            stored = CODES.get(phone)
            if not stored:
                send_json(self, {'error': '验证码已过期，请重新获取'}, 400); return
            if stored != code:
                send_json(self, {'error': '验证码错误'}, 400); return
            del CODES[phone]

            # 自动注册/登录
            users = load_users()
            if phone not in users:
                users[phone] = {
                    'phone': phone,
                    'displayName': phone[:3] + '****' + phone[-4:],
                    'createdAt': datetime.now().isoformat()
                }
                save_users(users)
                save_user_data(phone, get_user_data(phone))

            token = secrets.token_hex(32)
            SESSIONS[token] = phone
            user = users.get(phone, {})
            send_json(self, {'success': True, 'token': token, 'phone': phone, 'displayName': user.get('displayName', phone[:3] + '****' + phone[-4:])})
            return

        # 保存术语
        if path == '/api/terms':
            phone = check_auth(self.headers)
            if not phone:
                send_json(self, {'error': '未登录'}, 401); return
            body = read_body(self)
            save_user_data(phone, body)
            send_json(self, {'success': True})
            return

        # AI 术语查询
        if path == '/api/ai-lookup':
            body = read_body(self)
            term_name = body.get('term', '').strip()
            if not term_name:
                send_json(self, {'success': False, 'error': '请提供术语名称'}, 400); return

            api_key = os.environ.get('DOUBAO_API_KEY', '')
            endpoint_id = os.environ.get('DOUBAO_ENDPOINT_ID', '')

            if not api_key or not endpoint_id:
                # 未配置 API，返回提示
                send_json(self, {'success': False, 'error': '未配置豆包 API，请设置环境变量 DOUBAO_API_KEY 和 DOUBAO_ENDPOINT_ID'})
                return

            try:
                import urllib.request
                prompt = f'''你是一个物流关务领域的专业助手。请查找以下术语的详细信息，严格按照JSON格式返回，不要返回任何其他内容：

术语：{term_name}

请返回如下JSON格式（不要加markdown代码块标记）：
{{
  "term": "术语中文名",
  "abbreviation": "英文缩写（如B/L、FOB等，没有则填空字符串）",
  "fullName": "英文全称（如Bill of Lading，没有则填空字符串）",
  "category": "分类（从以下选择最合适的：运输方式、单证、贸易术语、海关、仓储、保险、费用）",
  "description": "详细解释（50-200字，专业准确）"
}}'''

                req_data = json.dumps({
                    'model': endpoint_id,
                    'messages': [
                        {'role': 'system', 'content': '你是物流关务领域的专业助手，只返回JSON格式的数据，不要返回任何解释或markdown标记。'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.1,
                    'max_tokens': 500
                }).encode('utf-8')

                req = urllib.request.Request(
                    'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                    data=req_data,
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {api_key}'
                    }
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read().decode('utf-8'))

                content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                json_str = content.strip().replace('```json', '').replace('```', '').strip()
                parsed = json.loads(json_str)

                send_json(self, {
                    'success': True,
                    'data': {
                        'term': parsed.get('term', term_name),
                        'abbreviation': parsed.get('abbreviation', ''),
                        'fullName': parsed.get('fullName', ''),
                        'category': parsed.get('category', ''),
                        'description': parsed.get('description', '')
                    }
                })
            except Exception as e:
                print(f'  [AI Error] {e}')
                send_json(self, {'success': False, 'error': 'AI 查询失败，请重试'})
            return

        send_json(self, {'error': '未找到'}, 404)

    def serve_static(self, filename, content_type):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        filepath = os.path.join(base_dir, filename)
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', f'{content_type}; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            send_json(self, {'error': '文件未找到'}, 404)

# ========== 启动 ==========
def main():
    server = http.server.HTTPServer((HOST, PORT), GlossaryHandler)
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()

    print('=' * 50)
    print('  物流关务术语库 - 服务器已启动')
    print('=' * 50)
    print(f'  本机访问: http://localhost:{PORT}')
    print(f'  局域网访问: http://{local_ip}:{PORT}')
    print(f'  数据目录: {DATA_DIR}')
    print('  [开发模式] 验证码将直接显示在控制台和响应中')
    print('=' * 50)
    print('  按 Ctrl+C 停止服务器')
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()

if __name__ == '__main__':
    main()