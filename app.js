// ========== 物流关务术语库 - 主应用逻辑 ==========

(function () {
  'use strict';

  // ========== 常量与配置 ==========
  var STORAGE_KEY_TERMS = 'logistics_glossary_terms';
  var STORAGE_KEY_CATEGORIES = 'logistics_glossary_categories';
  var PAGE_SIZE = 15;

  // ========== 初始示例数据 ==========
  var SAMPLE_CATEGORIES = ['运输方式', '单证', '贸易术语', '海关', '仓储', '保险', '费用'];

  var SAMPLE_TERMS = [
    { id: '1', term: '提单', abbreviation: 'B/L', fullName: 'Bill of Lading', category: '单证', description: '由承运人或其代理人签发的，确认收到货物并承诺在目的地交付货物的单据。是物权凭证、运输契约的证明和货物收据。', createdAt: Date.now() - 86400000 * 30 },
    { id: '2', term: '海运提单', abbreviation: 'OBL', fullName: 'Ocean Bill of Lading', category: '单证', description: '海运方式下签发的提单，是最常见的提单类型，具有物权凭证功能。', createdAt: Date.now() - 86400000 * 29 },
    { id: '3', term: '离岸价', abbreviation: 'FOB', fullName: 'Free on Board', category: '贸易术语', description: '国际贸易术语，卖方在指定装运港将货物交至船边或越过船舷即完成交货义务，买方承担此后的一切费用和风险。', createdAt: Date.now() - 86400000 * 28 },
    { id: '4', term: '到岸价', abbreviation: 'CIF', fullName: 'Cost, Insurance and Freight', category: '贸易术语', description: '国际贸易术语，卖方负责租船订舱、支付到目的港的运费和保险费，但风险在装运港越过船舷时转移。', createdAt: Date.now() - 86400000 * 27 },
    { id: '5', term: '运费付至', abbreviation: 'CPT', fullName: 'Carriage Paid To', category: '贸易术语', description: '卖方支付将货物运至目的地的运费，风险在货物交给第一承运人时转移。', createdAt: Date.now() - 86400000 * 26 },
    { id: '6', term: '集装箱', abbreviation: 'TEU', fullName: 'Twenty-foot Equivalent Unit', category: '运输方式', description: '20英尺标准集装箱单位，用于衡量集装箱船舶装载能力和港口吞吐量的标准计量单位。', createdAt: Date.now() - 86400000 * 25 },
    { id: '7', term: '整箱货', abbreviation: 'FCL', fullName: 'Full Container Load', category: '运输方式', description: '一个集装箱内只装载一个发货人的货物，由发货人负责装箱、计数、积载和封箱。', createdAt: Date.now() - 86400000 * 24 },
    { id: '8', term: '拼箱货', abbreviation: 'LCL', fullName: 'Less than Container Load', category: '运输方式', description: '多个发货人的零星货物拼装在一个集装箱内，由承运人或其代理人负责装箱和拆箱。', createdAt: Date.now() - 86400000 * 23 },
    { id: '9', term: '报关', abbreviation: 'CD', fullName: 'Customs Declaration', category: '海关', description: '进出口货物的收发货人或其代理人向海关申报货物详情，接受海关审核监督的行为。', createdAt: Date.now() - 86400000 * 22 },
    { id: '10', term: '海关编码', abbreviation: 'HS', fullName: 'Harmonized System', category: '海关', description: '商品名称及编码协调制度，是国际贸易中用于商品分类的标准编码体系，中国使用10位HS编码。', createdAt: Date.now() - 86400000 * 21 },
    { id: '11', term: '仓单', abbreviation: 'WR', fullName: 'Warehouse Receipt', category: '仓储', description: '仓库经营者签发的确认收到仓储货物的凭证，是提取仓储货物的合法凭证。', createdAt: Date.now() - 86400000 * 20 },
    { id: '12', term: '保险单', abbreviation: 'IP', fullName: 'Insurance Policy', category: '保险', description: '保险人签发的证明保险合同成立的书面文件，载明保险双方的权利义务关系。', createdAt: Date.now() - 86400000 * 19 },
    { id: '13', term: '产地证', abbreviation: 'CO', fullName: 'Certificate of Origin', category: '单证', description: '由出口国政府或公证机构签发的证明货物原产地的文件，是海关征税和统计的依据。', createdAt: Date.now() - 86400000 * 18 },
    { id: '14', term: '成本加运费', abbreviation: 'CFR', fullName: 'Cost and Freight', category: '贸易术语', description: '卖方支付将货物运至指定目的港所需的运费，但货物的灭失或损坏风险在装运港越过船舷时转移。', createdAt: Date.now() - 86400000 * 17 },
    { id: '15', term: '承运人', abbreviation: 'CAR', fullName: 'Carrier', category: '运输方式', description: '在运输合同中承担运输责任的当事人，即经营运输工具并从事客货运输业务的个人或企业。', createdAt: Date.now() - 86400000 * 16 },
    { id: '16', term: '货运代理', abbreviation: 'FF', fullName: 'Freight Forwarder', category: '运输方式', description: '接受发货人或收货人委托，以自己的名义或以委托人的名义，为委托人办理国际货物运输及相关业务的人。', createdAt: Date.now() - 86400000 * 15 },
    { id: '17', term: '关税', abbreviation: 'DU', fullName: 'Duty', category: '费用', description: '进出口商品经过一国关境时，由政府设置的海关向进出口商征收的税收。包括进口关税和出口关税。', createdAt: Date.now() - 86400000 * 14 },
    { id: '18', term: '增值税', abbreviation: 'VAT', fullName: 'Value Added Tax', category: '费用', description: '以商品生产流通和劳务服务各个环节的增值额为征税对象征收的一种流转税。进口环节增值税由海关代征。', createdAt: Date.now() - 86400000 * 13 },
    { id: '19', term: '港口拥挤费', abbreviation: 'CS', fullName: 'Congestion Surcharge', category: '费用', description: '因港口拥挤导致船舶等待时间延长而向货方收取的附加费用。', createdAt: Date.now() - 86400000 * 12 },
    { id: '20', term: '免箱期', abbreviation: 'FT', fullName: 'Free Time', category: '仓储', description: '集装箱从卸船到交货或从提箱到还箱期间，船公司允许免费使用集装箱的期限，超过后收取滞箱费。', createdAt: Date.now() - 86400000 * 11 }
  ];

  // ========== 应用状态 ==========
  var state = {
    terms: [],
    categories: [],
    searchQuery: '',
    categoryFilter: '',
    sortField: 'createdAt',
    sortOrder: 'asc',
    currentPage: 1,
    selectedIds: {},
    editingTermId: null
  };

  // ========== 数据持久化 ==========
  function loadData() {
    try {
      var termsData = localStorage.getItem(STORAGE_KEY_TERMS);
      var categoriesData = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (termsData) {
        state.terms = JSON.parse(termsData);
      } else {
        state.terms = SAMPLE_TERMS;
        saveTerms();
      }
      if (categoriesData) {
        state.categories = JSON.parse(categoriesData);
      } else {
        state.categories = SAMPLE_CATEGORIES;
        saveCategories();
      }
    } catch (e) {
      state.terms = SAMPLE_TERMS;
      state.categories = SAMPLE_CATEGORIES;
      saveTerms();
      saveCategories();
    }
  }

  function saveTerms() {
    localStorage.setItem(STORAGE_KEY_TERMS, JSON.stringify(state.terms));
  }

  function saveCategories() {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(state.categories));
  }

  // ========== 工具函数 ==========
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightText(text, query) {
    if (!text || !query) return escapeHtml(text);
    var escaped = escapeHtml(text);
    var queryEscaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + queryEscaped + ')', 'gi');
    return escaped.replace(regex, '<span class="highlight">$1</span>');
  }

  function fuzzyMatch(text, query) {
    if (!text || !query) return false;
    var lowerText = text.toLowerCase();
    var lowerQuery = query.toLowerCase();
    if (lowerText.indexOf(lowerQuery) !== -1) return true;
    var qi = 0;
    for (var ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
      if (lowerText[ti] === lowerQuery[qi]) qi++;
    }
    return qi === lowerQuery.length;
  }

  function hasSelected(id) {
    return !!state.selectedIds[id];
  }

  function addSelected(id) {
    state.selectedIds[id] = true;
  }

  function removeSelected(id) {
    delete state.selectedIds[id];
  }

  function clearSelected() {
    state.selectedIds = {};
  }

  function selectedCount() {
    return Object.keys(state.selectedIds).length;
  }

  function selectedIdArray() {
    return Object.keys(state.selectedIds);
  }

  // ========== 数据过滤与排序 ==========
  function getFilteredTerms() {
    var filtered = state.terms.slice();

    if (state.searchQuery) {
      var q = state.searchQuery;
      filtered = filtered.filter(function (t) {
        return fuzzyMatch(t.term, q) || fuzzyMatch(t.abbreviation, q) || fuzzyMatch(t.fullName, q) || fuzzyMatch(t.description, q);
      });
    }

    if (state.categoryFilter) {
      filtered = filtered.filter(function (t) { return t.category === state.categoryFilter; });
    }

    filtered.sort(function (a, b) {
      var valA = a[state.sortField];
      var valB = b[state.sortField];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return state.sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  function getPagedTerms(filtered) {
    var start = (state.currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }

  function getTotalPages(filtered) {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }

  // ========== 渲染：术语表格 ==========
  function renderTable() {
    var filtered = getFilteredTerms();
    var paged = getPagedTerms(filtered);
    var tbody = document.getElementById('termBody');
    var emptyState = document.getElementById('emptyState');
    var table = document.getElementById('termTable');

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
      if (state.searchQuery || state.categoryFilter) {
        emptyState.querySelector('p').textContent = '没有找到匹配的术语';
        emptyState.querySelector('.hint').textContent = '尝试修改搜索条件或筛选';
      } else {
        emptyState.querySelector('p').textContent = '暂无术语数据';
        emptyState.querySelector('.hint').textContent = '点击"添加术语"按钮开始添加';
      }
    } else {
      table.style.display = '';
      emptyState.style.display = 'none';
    }

    var q = state.searchQuery;
    var html = '';
    for (var i = 0; i < paged.length; i++) {
      var term = paged[i];
      var isSelected = hasSelected(term.id);
      var catClass = term.category ? 'category-tag' : 'category-tag uncategorized';
      var catText = term.category || '未分类';
      html += '<tr class="' + (isSelected ? 'selected' : '') + '" data-id="' + term.id + '">';
      html += '<td class="col-check"><input type="checkbox" class="row-check" data-id="' + term.id + '" ' + (isSelected ? 'checked' : '') + ' /></td>';
      html += '<td><span class="term-name">' + highlightText(term.term, q) + '</span></td>';
      html += '<td><span class="abbr-text">' + highlightText(term.abbreviation, q) + '</span></td>';
      html += '<td><span class="full-name-text">' + highlightText(term.fullName, q) + '</span></td>';
      html += '<td><span class="' + catClass + '">' + escapeHtml(catText) + '</span></td>';
      html += '<td><span class="desc-text">' + highlightText(term.description, q) + '</span></td>';
      html += '<td><span class="time-text">' + formatTime(term.createdAt) + '</span></td>';
      html += '<td class="col-actions">';
      html += '<button class="btn-icon edit" title="编辑" onclick="app.editTerm(\'' + term.id + '\')"><i class="fas fa-pen"></i></button>';
      html += '<button class="btn-icon delete" title="删除" onclick="app.deleteTerm(\'' + term.id + '\')"><i class="fas fa-trash"></i></button>';
      html += '</td></tr>';
    }
    tbody.innerHTML = html;

    var checkboxes = tbody.querySelectorAll('.row-check');
    for (var j = 0; j < checkboxes.length; j++) {
      checkboxes[j].addEventListener('change', function (e) {
        var id = e.target.dataset.id;
        if (e.target.checked) { addSelected(id); } else { removeSelected(id); }
        updateSelectionUI();
        renderTable();
      });
    }

    renderPagination(filtered.length);
    renderStats(filtered.length);
    updateSortHeaders();
  }

  // ========== 渲染：分页 ==========
  function renderPagination(totalItems) {
    var filtered = getFilteredTerms();
    var totalPages = getTotalPages(filtered);
    var container = document.getElementById('pagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    var html = '';
    html += '<button ' + (state.currentPage === 1 ? 'disabled' : '') + ' onclick="app.goToPage(' + (state.currentPage - 1) + ')"><i class="fas fa-chevron-left"></i></button>';

    var maxVisible = 5;
    var startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    var endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) { startPage = Math.max(1, endPage - maxVisible + 1); }

    if (startPage > 1) {
      html += '<button onclick="app.goToPage(1)">1</button>';
      if (startPage > 2) html += '<span class="page-info">...</span>';
    }
    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="' + (i === state.currentPage ? 'active' : '') + '" onclick="app.goToPage(' + i + ')">' + i + '</button>';
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += '<span class="page-info">...</span>';
      html += '<button onclick="app.goToPage(' + totalPages + ')">' + totalPages + '</button>';
    }

    html += '<button ' + (state.currentPage === totalPages ? 'disabled' : '') + ' onclick="app.goToPage(' + (state.currentPage + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
    html += '<span class="page-info">共 ' + totalItems + ' 条</span>';
    container.innerHTML = html;
  }

  // ========== 渲染：统计 ==========
  function renderStats(filteredCount) {
    var statsEl = document.getElementById('stats');
    var total = state.terms.length;
    var categories = state.categories.length;
    if (state.searchQuery || state.categoryFilter) {
      statsEl.textContent = '共 ' + total + ' 条术语 · ' + categories + ' 个分类 · 筛选结果 ' + filteredCount + ' 条';
    } else {
      statsEl.textContent = '共 ' + total + ' 条术语 · ' + categories + ' 个分类';
    }
  }

  // ========== 渲染：排序表头 ==========
  function updateSortHeaders() {
    var ths = document.querySelectorAll('th[data-sort]');
    for (var i = 0; i < ths.length; i++) {
      ths[i].classList.remove('sort-asc', 'sort-desc');
      var field = ths[i].dataset.sort;
      if (field === state.sortField) {
        ths[i].classList.add(state.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    }
  }

  // ========== 渲染：分类下拉 ==========
  function renderCategorySelects() {
    var filterSelect = document.getElementById('categoryFilter');
    var formSelect = document.getElementById('termCategory');
    var currentFilter = filterSelect.value;

    var filterHtml = '<option value="">全部分类</option>';
    for (var i = 0; i < state.categories.length; i++) {
      var c = state.categories[i];
      filterHtml += '<option value="' + escapeHtml(c) + '" ' + (c === currentFilter ? 'selected' : '') + '>' + escapeHtml(c) + '</option>';
    }
    filterSelect.innerHTML = filterHtml;

    var formHtml = '<option value="">未分类</option>';
    for (var j = 0; j < state.categories.length; j++) {
      formHtml += '<option value="' + escapeHtml(state.categories[j]) + '">' + escapeHtml(state.categories[j]) + '</option>';
    }
    formSelect.innerHTML = formHtml;
  }

  // ========== 渲染：分类列表 ==========
  function renderCategoryList() {
    var list = document.getElementById('categoryList');
    var html = '';
    for (var i = 0; i < state.categories.length; i++) {
      var cat = state.categories[i];
      var count = 0;
      for (var j = 0; j < state.terms.length; j++) {
        if (state.terms[j].category === cat) count++;
      }
      html += '<li>';
      html += '<div class="cat-name"><i class="fas fa-tag" style="color:var(--primary);font-size:12px"></i><span>' + escapeHtml(cat) + '</span><span class="cat-count">' + count + '</span></div>';
      html += '<div class="cat-actions">';
      html += '<button class="btn-icon edit" title="重命名" onclick="app.renameCategory(\'' + escapeHtml(cat).replace(/'/g, "\\'") + '\')"><i class="fas fa-pen"></i></button>';
      html += '<button class="btn-icon delete" title="删除" onclick="app.deleteCategory(\'' + escapeHtml(cat).replace(/'/g, "\\'") + '\')"><i class="fas fa-trash"></i></button>';
      html += '</div></li>';
    }
    list.innerHTML = html;
  }

  // ========== 选择管理 ==========
  function updateSelectionUI() {
    var count = selectedCount();
    var btn = document.getElementById('batchDeleteBtn');
    var countSpan = document.getElementById('selectedCount');
    countSpan.textContent = count;
    btn.style.display = count > 0 ? 'inline-flex' : 'none';

    var selectAll = document.getElementById('selectAll');
    var filtered = getFilteredTerms();
    var paged = getPagedTerms(filtered);
    var allChecked = paged.length > 0;
    var someChecked = false;
    for (var i = 0; i < paged.length; i++) {
      if (hasSelected(paged[i].id)) { someChecked = true; } else { allChecked = false; }
    }
    selectAll.checked = allChecked;
    selectAll.indeterminate = someChecked && !allChecked;
  }

  // ========== 弹窗管理 ==========
  function openModal(id) { document.getElementById(id).classList.add('active'); }
  function closeModal(id) { document.getElementById(id).classList.remove('active'); }

  // ========== Toast ==========
  function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="fas ' + icons[type] + '"></i><span>' + escapeHtml(message) + '</span>';
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = '0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  // ========== 确认弹窗 ==========
  var confirmCallback = null;
  function showConfirm(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    openModal('confirmModal');
  }

  // ========== CRUD：添加/编辑术语 ==========
  function openTermForm(termId) {
    state.editingTermId = termId || null;
    var title = document.getElementById('modalTitle');
    if (termId) {
      var term = null;
      for (var i = 0; i < state.terms.length; i++) {
        if (state.terms[i].id === termId) { term = state.terms[i]; break; }
      }
      if (!term) return;
      title.textContent = '编辑术语';
      document.getElementById('termId').value = term.id;
      document.getElementById('termName').value = term.term;
      document.getElementById('termAbbr').value = term.abbreviation || '';
      document.getElementById('termFullName').value = term.fullName || '';
      document.getElementById('termDesc').value = term.description || '';
    } else {
      title.textContent = '添加术语';
      document.getElementById('termForm').reset();
      document.getElementById('termId').value = '';
    }
    renderCategorySelects();
    if (termId) {
      var t = null;
      for (var j = 0; j < state.terms.length; j++) {
        if (state.terms[j].id === termId) { t = state.terms[j]; break; }
      }
      document.getElementById('termCategory').value = t ? (t.category || '') : '';
    }
    openModal('termModal');
    setTimeout(function () { document.getElementById('termName').focus(); }, 100);
  }

  function saveTerm() {
    var name = document.getElementById('termName').value.trim();
    var abbr = document.getElementById('termAbbr').value.trim();
    var fullName = document.getElementById('termFullName').value.trim();
    var category = document.getElementById('termCategory').value;
    var desc = document.getElementById('termDesc').value.trim();

    if (!name) { showToast('请输入术语名称', 'error'); document.getElementById('termName').focus(); return; }

    if (state.editingTermId) {
      for (var i = 0; i < state.terms.length; i++) {
        if (state.terms[i].id === state.editingTermId) {
          state.terms[i].term = name;
          state.terms[i].abbreviation = abbr;
          state.terms[i].fullName = fullName;
          state.terms[i].category = category;
          state.terms[i].description = desc;
          state.terms[i].updatedAt = Date.now();
          break;
        }
      }
      showToast('术语已更新', 'success');
    } else {
      for (var k = 0; k < state.terms.length; k++) {
        if (state.terms[k].term === name) { showToast('该术语已存在', 'warning'); return; }
      }
      state.terms.unshift({ id: generateId(), term: name, abbreviation: abbr, fullName: fullName, category: category, description: desc, createdAt: Date.now() });
      showToast('术语已添加', 'success');
    }

    saveTerms();
    closeModal('termModal');
    state.editingTermId = null;
    state.currentPage = 1;
    renderTable();
    renderCategorySelects();
  }

  // ========== CRUD：删除术语 ==========
  function deleteTerm(id) {
    var term = null;
    for (var i = 0; i < state.terms.length; i++) {
      if (state.terms[i].id === id) { term = state.terms[i]; break; }
    }
    if (!term) return;
    showConfirm('删除术语', '确定要删除术语"' + term.term + '"吗？此操作不可撤销。', function () {
      state.terms = state.terms.filter(function (t) { return t.id !== id; });
      removeSelected(id);
      saveTerms();
      renderTable();
      renderCategorySelects();
      updateSelectionUI();
      showToast('术语已删除', 'success');
    });
  }

  function batchDelete() {
    var count = selectedCount();
    if (count === 0) return;
    showConfirm('批量删除', '确定要删除选中的 ' + count + ' 条术语吗？此操作不可撤销。', function () {
      var ids = selectedIdArray();
      state.terms = state.terms.filter(function (t) { return ids.indexOf(t.id) === -1; });
      clearSelected();
      saveTerms();
      renderTable();
      renderCategorySelects();
      updateSelectionUI();
      showToast('已删除 ' + count + ' 条术语', 'success');
    });
  }

  // ========== 分类管理 ==========
  function addCategory() {
    var input = document.getElementById('newCategoryInput');
    var name = input.value.trim();
    if (!name) { showToast('请输入分类名称', 'error'); input.focus(); return; }
    if (state.categories.indexOf(name) !== -1) { showToast('该分类已存在', 'warning'); return; }
    state.categories.push(name);
    saveCategories();
    input.value = '';
    renderCategoryList();
    renderCategorySelects();
    showToast('分类已添加', 'success');
  }

  function renameCategory(oldName) {
    var newName = prompt('请输入新的分类名称：', oldName);
    if (!newName || newName.trim() === '' || newName.trim() === oldName) return;
    var trimmed = newName.trim();
    if (state.categories.indexOf(trimmed) !== -1) { showToast('该分类名称已存在', 'warning'); return; }
    var idx = state.categories.indexOf(oldName);
    if (idx !== -1) {
      state.categories[idx] = trimmed;
      for (var i = 0; i < state.terms.length; i++) {
        if (state.terms[i].category === oldName) state.terms[i].category = trimmed;
      }
      saveCategories(); saveTerms();
      renderCategoryList(); renderCategorySelects(); renderTable();
      showToast('分类已重命名', 'success');
    }
  }

  function deleteCategory(name) {
    var count = 0;
    for (var i = 0; i < state.terms.length; i++) {
      if (state.terms[i].category === name) count++;
    }
    var msg = count > 0
      ? '分类"' + name + '"下有 ' + count + ' 条术语，删除后这些术语将变为"未分类"。确定删除吗？'
      : '确定要删除分类"' + name + '"吗？';
    showConfirm('删除分类', msg, function () {
      state.categories = state.categories.filter(function (c) { return c !== name; });
      for (var j = 0; j < state.terms.length; j++) {
        if (state.terms[j].category === name) state.terms[j].category = '';
      }
      if (state.categoryFilter === name) state.categoryFilter = '';
      saveCategories(); saveTerms();
      renderCategoryList(); renderCategorySelects(); renderTable();
      showToast('分类已删除', 'success');
    });
  }

  // ========== 搜索 ==========
  var searchTimer = null;
  function handleSearch(value) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.searchQuery = value.trim();
      state.currentPage = 1;
      renderTable();
    }, 200);
  }

  // ========== 排序 ==========
  function handleSort(field) {
    if (state.sortField === field) {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortField = field;
      state.sortOrder = 'asc';
    }
    renderTable();
  }

  // ========== 导出 ==========
  function exportData(format) {
    var scopeEl = document.querySelector('input[name="exportScope"]:checked');
    var scope = scopeEl ? scopeEl.value : 'all';
    var data = [];
    if (scope === 'all') { data = state.terms; }
    else if (scope === 'filtered') { data = getFilteredTerms(); }
    else if (scope === 'selected') {
      var ids = selectedIdArray();
      data = state.terms.filter(function (t) { return ids.indexOf(t.id) !== -1; });
    }

    if (data.length === 0) { showToast('没有可导出的数据', 'warning'); return; }

    var content, filename, mimeType;
    if (format === 'json') {
      var exportObj = {
        exportDate: new Date().toISOString(),
        categories: state.categories,
        terms: data.map(function (t) { return { term: t.term, abbreviation: t.abbreviation || '', fullName: t.fullName || '', category: t.category || '', description: t.description || '' }; })
      };
      content = JSON.stringify(exportObj, null, 2);
      filename = '物流关务术语库_' + formatDate(new Date()) + '.json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      var BOM = '\uFEFF';
      var headers = ['术语', '英文缩写', '英文全拼', '分类', '解释'];
      var rows = data.map(function (t) {
        return ['"' + (t.term || '').replace(/"/g, '""') + '"', '"' + (t.abbreviation || '').replace(/"/g, '""') + '"', '"' + (t.fullName || '').replace(/"/g, '""') + '"', '"' + (t.category || '').replace(/"/g, '""') + '"', '"' + (t.description || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"'].join(',');
      });
      content = BOM + [headers.join(','), rows.join('\n')].join('\n');
      filename = '物流关务术语库_' + formatDate(new Date()) + '.csv';
      mimeType = 'text/csv;charset=utf-8';
    } else if (format === 'excel') {
      var wsData = [['术语', '英文缩写', '英文全拼', '分类', '解释']];
      for (var ei = 0; ei < data.length; ei++) {
        var d = data[ei];
        wsData.push([d.term || '', d.abbreviation || '', d.fullName || '', d.category || '', d.description || '']);
      }
      var ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 60 }];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '术语库');
      filename = '物流关务术语库_' + formatDate(new Date()) + '.xlsx';
      XLSX.writeFile(wb, filename);
      closeModal('exportModal');
      showToast('已导出 ' + data.length + ' 条术语', 'success');
      return;
    }

    downloadFile(content, filename, mimeType);
    closeModal('exportModal');
    showToast('已导出 ' + data.length + ' 条术语', 'success');
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatDate(date) {
    return date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  }

  function formatTime(timestamp) {
    if (!timestamp) return '-';
    var d = new Date(timestamp);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    document.getElementById('searchInput').addEventListener('input', function (e) { handleSearch(e.target.value); });
    document.getElementById('clearSearch').addEventListener('click', function () { document.getElementById('searchInput').value = ''; handleSearch(''); });

    document.getElementById('categoryFilter').addEventListener('change', function (e) { state.categoryFilter = e.target.value; state.currentPage = 1; renderTable(); });

    var sortThs = document.querySelectorAll('th[data-sort]');
    for (var i = 0; i < sortThs.length; i++) {
      sortThs[i].addEventListener('click', function () { handleSort(this.dataset.sort); });
    }

    document.getElementById('selectAll').addEventListener('change', function (e) {
      var paged = getPagedTerms(getFilteredTerms());
      for (var i = 0; i < paged.length; i++) {
        if (e.target.checked) { addSelected(paged[i].id); } else { removeSelected(paged[i].id); }
      }
      renderTable(); updateSelectionUI();
    });

    document.getElementById('addTermBtn').addEventListener('click', function () { openTermForm(); });
    document.getElementById('saveTermModal').addEventListener('click', saveTerm);
    document.getElementById('cancelTermModal').addEventListener('click', function () { closeModal('termModal'); });
    document.getElementById('closeTermModal').addEventListener('click', function () { closeModal('termModal'); });

    document.getElementById('termForm').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); saveTerm(); }
    });

    document.getElementById('batchDeleteBtn').addEventListener('click', batchDelete);

    document.getElementById('addCategoryBtn').addEventListener('click', function () {
      renderCategoryList(); openModal('categoryModal');
      setTimeout(function () { document.getElementById('newCategoryInput').focus(); }, 100);
    });
    document.getElementById('addCategoryConfirm').addEventListener('click', addCategory);
    document.getElementById('newCategoryInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } });
    document.getElementById('closeCategoryModal').addEventListener('click', function () { closeModal('categoryModal'); });
    document.getElementById('closeCategoryModalBtn').addEventListener('click', function () { closeModal('categoryModal'); });

    document.getElementById('exportBtn').addEventListener('click', function () {
      var opts = document.querySelectorAll('.export-option');
      for (var i = 0; i < opts.length; i++) opts[i].classList.remove('selected');
      document.getElementById('exportJSON').classList.add('selected');
      openModal('exportModal');
    });
    document.getElementById('closeExportModal').addEventListener('click', function () { closeModal('exportModal'); });
    document.getElementById('closeExportModalBtn').addEventListener('click', function () { closeModal('exportModal'); });
    document.getElementById('exportJSON').addEventListener('click', function () { exportData('json'); });
    document.getElementById('exportCSV').addEventListener('click', function () { exportData('csv'); });
    document.getElementById('exportExcel').addEventListener('click', function () { exportData('excel'); });

    document.getElementById('confirmAction').addEventListener('click', function () { if (confirmCallback) { confirmCallback(); confirmCallback = null; } closeModal('confirmModal'); });
    document.getElementById('cancelConfirm').addEventListener('click', function () { confirmCallback = null; closeModal('confirmModal'); });
    document.getElementById('closeConfirmModal').addEventListener('click', function () { confirmCallback = null; closeModal('confirmModal'); });

    var modals = document.querySelectorAll('.modal');
    for (var m = 0; m < modals.length; m++) {
      modals[m].addEventListener('click', function (e) { if (e.target === this) { this.classList.remove('active'); confirmCallback = null; } });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var activeModals = document.querySelectorAll('.modal.active');
        for (var i = 0; i < activeModals.length; i++) activeModals[i].classList.remove('active');
        confirmCallback = null;
      }
    });
  }

  // ========== 公开 API ==========
  window.app = {
    editTerm: function (id) { openTermForm(id); },
    deleteTerm: deleteTerm,
    goToPage: function (page) {
      var totalPages = getTotalPages(getFilteredTerms());
      if (page < 1 || page > totalPages) return;
      state.currentPage = page;
      clearSelected();
      renderTable(); updateSelectionUI();
    },
    renameCategory: renameCategory,
    deleteCategory: deleteCategory
  };

  // ========== 初始化 ==========
  function init() {
    loadData();
    renderCategorySelects();
    renderTable();
    updateSelectionUI();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();