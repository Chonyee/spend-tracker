// ========== Category Config ==========
const CATEGORIES = {
  'Food & Dining':     { color: '#d29922' },
  'Transportation':    { color: '#58a6ff' },
  'Shopping':          { color: '#f778ba' },
  'Entertainment':     { color: '#bc8cff' },
  'Bills & Utilities': { color: '#3fb950' },
  'Health':            { color: '#f85149' },
  'Education':         { color: '#6cb6ff' },
  'Travel':            { color: '#39d2c0' },
  'Personal Care':     { color: '#db6d28' },
  'Paycheck / Salary': { color: '#7ee787' },
  'Other':             { color: '#8b949e' },
};

// ========== State ==========
let transactions = [];

// ========== DOM References ==========
const form = document.getElementById('transactionForm');
const descInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const totalExpensesEl = document.getElementById('totalExpenses');
const totalIncomeEl = document.getElementById('totalIncome');
const netAmountEl = document.getElementById('netAmount');
const totalCountEl = document.getElementById('totalCount');
const catCountEl = document.getElementById('catCount');
const categoryTableEl = document.getElementById('categoryTable');
const transactionBodyEl = document.getElementById('transactionBody');
const categoryFilterEl = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const monthFilterEl = document.getElementById('monthFilter');
const rowCountEl = document.getElementById('rowCount');
const statusMsgEl = document.getElementById('statusMsg');
const statusTimeEl = document.getElementById('statusTime');
const toastEl = document.getElementById('toast');
const pieChartEl = document.getElementById('pieChart');
const pieCenterValueEl = document.getElementById('pieCenterValue');
const pieLegendEl = document.getElementById('pieLegend');
const amtMinusBtn = document.getElementById('amtMinus');
const amtPlusBtn = document.getElementById('amtPlus');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const typeExpenseBtn = document.getElementById('typeExpense');
const typeIncomeBtn = document.getElementById('typeIncome');
const editTypeExpenseBtn = document.getElementById('editTypeExpense');
const editTypeIncomeBtn = document.getElementById('editTypeIncome');
const importCsvBtn = document.getElementById('importCsvBtn');
const csvFileInput = document.getElementById('csvFileInput');
const csvModal = document.getElementById('csvModal');
const csvModalClose = document.getElementById('csvModalClose');
const csvFileName = document.getElementById('csvFileName');
const csvFileMeta = document.getElementById('csvFileMeta');
const csvMappingTable = document.getElementById('csvMappingTable');
const csvCatMapping = document.getElementById('csvCatMapping');
const csvStep1 = document.getElementById('csvStep1');
const csvStep2 = document.getElementById('csvStep2');
const csvPreviewBody = document.getElementById('csvPreviewBody');
const csvPreviewMeta = document.getElementById('csvPreviewMeta');
const csvImportCount = document.getElementById('csvImportCount');
const csvCancelBtn = document.getElementById('csvCancel');
const csvPreviewBtn = document.getElementById('csvPreview');
const csvBackBtn = document.getElementById('csvBack');
const csvConfirmBtn = document.getElementById('csvConfirm');
const editModal = document.getElementById('editModal');
const editModalClose = document.getElementById('editModalClose');
const editForm = document.getElementById('editForm');
const editDescInput = document.getElementById('editDesc');
const editAmountInput = document.getElementById('editAmount');
const editDateInput = document.getElementById('editDate');
const editCategoryInput = document.getElementById('editCategory');
const editIdEl = document.getElementById('editId');
const editCancelBtn = document.getElementById('editCancel');
const addRecurringBtn = document.getElementById('addRecurringBtn');
const recurringListEl = document.getElementById('recurringList');
const recurringModal = document.getElementById('recurringModal');
const recurringModalTitle = document.getElementById('recurringModalTitle');
const recurringModalClose = document.getElementById('recurringModalClose');
const recurringForm = document.getElementById('recurringForm');
const recDescInput = document.getElementById('recDesc');
const recAmountInput = document.getElementById('recAmount');
const recCategoryInput = document.getElementById('recCategory');
const recFrequencyInput = document.getElementById('recFrequency');
const recDayInput = document.getElementById('recDay');
const recStartInput = document.getElementById('recStart');
const recurringCancelBtn = document.getElementById('recurringCancel');
const recSubmitBtn = document.getElementById('recSubmitBtn');
const recTypeExpenseBtn = document.getElementById('recTypeExpense');
const recTypeIncomeBtn = document.getElementById('recTypeIncome');
const tabLogBtn = document.getElementById('tabLog');
const tabAnalyticsBtn = document.getElementById('tabAnalytics');
const tabContentLog = document.getElementById('tabContentLog');
const tabContentAnalytics = document.getElementById('tabContentAnalytics');
const searchWrap = document.getElementById('searchWrap');

// ========== CSV State ==========
let csvParsedRows = [];
let csvHeaders = [];
let csvColumnMappings = {};   // colIndex -> field name
let csvCategoryMap = {};       // original value -> SpendWise category
let csvMappedTransactions = [];
let editingTransactionId = null;
let currentType = 'expense';
let editType = 'expense';
let sortColumn = 'date';
let sortDirection = 'desc';
let recurringRules = [];
let editingRecurringId = null;
let recType = 'expense';

// ========== API Helpers ==========
async function apiGet() {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Failed to load transactions');
  return res.json();
}

async function apiAdd(transaction) {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error('Failed to save transaction');
  return res.json();
}

async function apiDelete(id) {
  const res = await fetch('/api/transactions/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  return res.json();
}

// ========== Recurring API ==========
async function apiGetRecurring() {
  const res = await fetch('/api/recurring');
  if (!res.ok) throw new Error('Failed to load recurring');
  return res.json();
}

async function apiSaveRecurring(rule) {
  const res = await fetch('/api/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Failed to save recurring');
  return res.json();
}

async function apiUpdateRecurring(rule) {
  const res = await fetch('/api/recurring/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Failed to update recurring');
  return res.json();
}

async function apiDeleteRecurring(id) {
  const res = await fetch('/api/recurring/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete recurring');
  return res.json();
}

// ========== Init ==========
async function init() {
  dateInput.value = today();

  try {
    transactions = await apiGet();
    recurringRules = await apiGetRecurring();
    const generated = await autoGenerateRecurring();
    const loadMsg = `Loaded ${transactions.length} record${transactions.length !== 1 ? 's' : ''}`;
    setStatus(generated > 0 ? `${loadMsg} + ${generated} recurring` : loadMsg);
  } catch (err) {
    setStatus('ERROR: Could not reach server');
    console.error(err);
  }

  populateMonthFilter();
  render();
  renderRecurringList();
  updateSortIndicators();

  form.addEventListener('submit', handleAddTransaction);
  categoryFilterEl.addEventListener('change', () => {
    syncCategoryHighlights();
    renderTransactionTable();
    updateStats();
  });
  monthFilterEl.addEventListener('change', render);
  searchInput.addEventListener('input', renderTransactionTable);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchInput.blur();
      renderTransactionTable();
    }
  });

  // Amount stepper buttons
  amtMinusBtn.addEventListener('click', () => stepAmount(-1));
  amtPlusBtn.addEventListener('click', () => stepAmount(1));

  // Type toggle (add form)
  typeExpenseBtn.addEventListener('click', () => setType('expense'));
  typeIncomeBtn.addEventListener('click', () => setType('income'));

  // Type toggle (edit form)
  editTypeExpenseBtn.addEventListener('click', () => setEditType('expense'));
  editTypeIncomeBtn.addEventListener('click', () => setEditType('income'));

  // Export CSV
  exportCsvBtn.addEventListener('click', handleExportCsv);

  // CSV import
  importCsvBtn.addEventListener('click', () => csvFileInput.click());
  csvFileInput.addEventListener('change', handleCsvFile);
  csvModalClose.addEventListener('click', closeCsvModal);
  csvCancelBtn.addEventListener('click', closeCsvModal);
  csvPreviewBtn.addEventListener('click', showCsvPreview);
  csvBackBtn.addEventListener('click', () => { csvStep2.classList.add('hidden'); csvStep1.classList.remove('hidden'); });
  csvConfirmBtn.addEventListener('click', confirmCsvImport);
  csvModal.addEventListener('click', (e) => { if (e.target === csvModal) closeCsvModal(); });

  // Edit modal
  editModalClose.addEventListener('click', closeEditModal);
  editCancelBtn.addEventListener('click', closeEditModal);
  editForm.addEventListener('submit', handleSaveEdit);
  editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

  // Recurring modal
  addRecurringBtn.addEventListener('click', openAddRecurring);
  recurringModalClose.addEventListener('click', closeRecurringModal);
  recurringCancelBtn.addEventListener('click', closeRecurringModal);
  recurringForm.addEventListener('submit', handleSaveRecurring);
  recurringModal.addEventListener('click', (e) => { if (e.target === recurringModal) closeRecurringModal(); });
  recFrequencyInput.addEventListener('change', updateDayLabel);
  recTypeExpenseBtn.addEventListener('click', () => setRecType('expense'));
  recTypeIncomeBtn.addEventListener('click', () => setRecType('income'));

  // Tabs
  tabLogBtn.addEventListener('click', () => switchTab('log'));
  tabAnalyticsBtn.addEventListener('click', () => switchTab('analytics'));

  // Sortable columns
  document.querySelectorAll('.col-sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = col;
        sortDirection = col === 'amount' ? 'desc' : 'asc';
      }
      updateSortIndicators();
      renderTransactionTable();
    });
  });

  updateClock();
  setInterval(updateClock, 1000);
}

// ========== Amount Stepper ==========
function stepAmount(dir) {
  const current = parseFloat(amountInput.value) || 0;
  const step = current >= 100 ? 10 : current >= 10 ? 1 : 0.5;
  const next = Math.max(0, +(current + dir * step).toFixed(2));
  amountInput.value = next || '';
  amountInput.focus();
}

// ========== Type Toggle ==========
function setType(type) {
  currentType = type;
  typeExpenseBtn.classList.toggle('active', type === 'expense');
  typeIncomeBtn.classList.toggle('active', type === 'income');
}

function setEditType(type) {
  editType = type;
  editTypeExpenseBtn.classList.toggle('active', type === 'expense');
  editTypeIncomeBtn.classList.toggle('active', type === 'income');
}

function setRecType(type) {
  recType = type;
  recTypeExpenseBtn.classList.toggle('active', type === 'expense');
  recTypeIncomeBtn.classList.toggle('active', type === 'income');
}

// ========== Add Transaction ==========
async function handleAddTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    description: descInput.value.trim(),
    amount: parseFloat(parseFloat(amountInput.value).toFixed(2)),
    category: categoryInput.value,
    date: dateInput.value,
    type: currentType,
  };

  try {
    await apiAdd(transaction);
    transactions.unshift(transaction);
    populateMonthFilter();
    render();
    setStatus(`INSERT → ${escapeHtml(transaction.description)} (${formatCurrency(transaction.amount)})`);
    showToast('Record inserted');
  } catch (err) {
    setStatus('ERROR: Write failed');
    showToast('Write failed — check server');
    console.error(err);
  }

  form.reset();
  dateInput.value = today();
  setType('expense');
  descInput.focus();
}

// ========== Delete Transaction ==========
async function deleteTransaction(id) {
  try {
    await apiDelete(id);
    const removed = transactions.find(t => t.id === id);
    transactions = transactions.filter(t => t.id !== id);
    populateMonthFilter();
    render();
    setStatus(`DELETE → ${removed ? escapeHtml(removed.description) : id}`);
    showToast('Record deleted');
  } catch (err) {
    setStatus('ERROR: Delete failed');
    showToast('Delete failed — check server');
    console.error(err);
  }
}

// ========== Filtering ==========
function getFilteredByMonth() {
  const month = monthFilterEl.value;
  if (month === 'all') return transactions;
  return transactions.filter(t => t.date.slice(0, 7) === month);
}

function getFullyFiltered() {
  const monthFiltered = getFilteredByMonth();
  const catFilter = categoryFilterEl.value;
  if (catFilter === 'all') return monthFiltered;
  return monthFiltered.filter(t => t.category === catFilter);
}

function selectCategory(cat) {
  // Toggle: same category deselects
  if (categoryFilterEl.value === cat) {
    categoryFilterEl.value = 'all';
  } else {
    categoryFilterEl.value = cat;
  }
  syncCategoryHighlights();
  renderTransactionTable();
  updateStats();
}

function syncCategoryHighlights() {
  const val = categoryFilterEl.value;
  // Sidebar rows
  categoryTableEl.querySelectorAll('.cat-row').forEach(r => {
    r.classList.toggle('active', r.dataset.category === val);
  });
  // Pie slices
  pieChartEl.querySelectorAll('.pie-slice').forEach(s => {
    const sliceCat = s.dataset.category;
    if (val === 'all') {
      s.classList.remove('dimmed', 'active-slice');
    } else {
      s.classList.toggle('active-slice', sliceCat === val);
      s.classList.toggle('dimmed', sliceCat !== val);
    }
  });
  // Legend items
  pieLegendEl.querySelectorAll('.pie-legend-item').forEach(li => {
    const legCat = li.dataset.category;
    if (val === 'all') {
      li.classList.remove('dimmed');
    } else {
      li.classList.toggle('dimmed', legCat !== val);
    }
  });
  // Update pie center text
  if (val !== 'all') {
    const filtered = getFullyFiltered().filter(t => (t.type || 'expense') === 'expense');
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    document.querySelector('.pie-center-label').textContent = val.toUpperCase().slice(0, 12);
    pieCenterValueEl.textContent = formatCurrency(total);
  } else {
    const filtered = getFilteredByMonth().filter(t => (t.type || 'expense') === 'expense');
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    document.querySelector('.pie-center-label').textContent = 'EXPENSES';
    pieCenterValueEl.textContent = formatCurrency(total);
  }
}

// ========== Stats ==========
function updateStats() {
  const filtered = getFullyFiltered();
  const expenses = filtered.filter(t => (t.type || 'expense') === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const net = income - expenses;
  const count = filtered.length;

  totalExpensesEl.textContent = formatCurrency(expenses);
  totalIncomeEl.textContent = formatCurrency(income);
  netAmountEl.textContent = (net >= 0 ? '+' : '-') + formatCurrency(Math.abs(net));
  netAmountEl.className = 'stat-value ' + (net >= 0 ? 'stat-net-pos' : 'stat-net-neg');
  totalCountEl.textContent = count;
}

// ========== Render ==========
function render() {
  const monthFiltered = getFilteredByMonth();
  const expensesOnly = monthFiltered.filter(t => (t.type || 'expense') === 'expense');
  renderCategoryBreakdown(expensesOnly);
  renderPieChart(expensesOnly);
  renderTransactionTable();
  updateStats();
}

function renderCategoryBreakdown(filtered) {
  const totals = {};

  filtered.forEach(t => {
    if (!totals[t.category]) totals[t.category] = { amount: 0, count: 0 };
    totals[t.category].amount += t.amount;
    totals[t.category].count++;
  });

  const entries = Object.entries(totals).sort((a, b) => b[1].amount - a[1].amount);
  const maxAmt = entries.length > 0 ? entries[0][1].amount : 0;
  const activeCat = categoryFilterEl.value;

  catCountEl.textContent = entries.length;

  if (entries.length === 0) {
    categoryTableEl.innerHTML = '<div class="empty-msg">No data.</div>';
    return;
  }

  categoryTableEl.innerHTML = entries.map(([cat, data]) => {
    const color = (CATEGORIES[cat] || CATEGORIES['Other']).color;
    const pct = maxAmt > 0 ? (data.amount / maxAmt) * 100 : 0;
    const isActive = activeCat === cat ? ' active' : '';
    return `
      <div class="cat-row${isActive}" data-category="${cat}">
        <div class="cat-name">
          <span class="cat-dot" style="background:${color}"></span>
          <span class="cat-label">${cat}</span>
        </div>
        <span class="cat-count">${data.count}x</span>
        <span class="cat-amount">${formatCurrency(data.amount)}</span>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');

  // Attach click handlers
  categoryTableEl.querySelectorAll('.cat-row').forEach(row => {
    row.addEventListener('click', () => selectCategory(row.dataset.category));
  });
}

// ========== Pie Chart ==========
function renderPieChart(filtered) {
  const totals = {};
  let grandTotal = 0;

  filtered.forEach(t => {
    if (!totals[t.category]) totals[t.category] = 0;
    totals[t.category] += t.amount;
    grandTotal += t.amount;
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const activeCat = categoryFilterEl.value;

  // Update center
  if (activeCat === 'all') {
    document.querySelector('.pie-center-label').textContent = 'TOTAL';
    pieCenterValueEl.textContent = formatCurrency(grandTotal);
  }

  if (entries.length === 0) {
    pieChartEl.innerHTML = `
      <circle cx="100" cy="100" r="70" fill="none" stroke="var(--border)" stroke-width="20"/>`;
    pieLegendEl.innerHTML = '';
    return;
  }

  // Build pie slices using SVG arc paths
  const cx = 100, cy = 100, r = 70;
  let currentAngle = -Math.PI / 2; // start at top
  let paths = '';

  entries.forEach(([cat, amount]) => {
    const color = (CATEGORIES[cat] || CATEGORIES['Other']).color;
    const pct = grandTotal > 0 ? amount / grandTotal : 0;
    const angle = pct * Math.PI * 2;

    // For a single category taking 100%, draw a full circle
    if (pct >= 0.9999) {
      paths += `<circle class="pie-slice${activeCat === cat ? ' active-slice' : (activeCat !== 'all' ? ' dimmed' : '')}"
        data-category="${cat}" cx="${cx}" cy="${cy}" r="${r}"
        fill="${color}" stroke="var(--bg-surface)" stroke-width="1.5"/>`;
    } else {
      const x1 = cx + r * Math.cos(currentAngle);
      const y1 = cy + r * Math.sin(currentAngle);
      const x2 = cx + r * Math.cos(currentAngle + angle);
      const y2 = cy + r * Math.sin(currentAngle + angle);
      const largeArc = angle > Math.PI ? 1 : 0;

      const dimClass = activeCat !== 'all' && activeCat !== cat ? ' dimmed' : '';
      const activeClass = activeCat === cat ? ' active-slice' : '';

      paths += `<path class="pie-slice${dimClass}${activeClass}" data-category="${cat}"
        d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z"
        fill="${color}" stroke="var(--bg-surface)" stroke-width="1.5"/>`;
    }

    currentAngle += angle;
  });

  // Inner circle for donut effect
  paths += `<circle cx="${cx}" cy="${cy}" r="42" fill="var(--bg-surface)"/>`;

  pieChartEl.innerHTML = paths;

  // Attach click handlers to slices
  pieChartEl.querySelectorAll('.pie-slice').forEach(slice => {
    slice.addEventListener('click', () => selectCategory(slice.dataset.category));
  });

  // Build legend
  pieLegendEl.innerHTML = entries.map(([cat, amount]) => {
    const color = (CATEGORIES[cat] || CATEGORIES['Other']).color;
    const pct = grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : '0.0';
    const dimClass = activeCat !== 'all' && activeCat !== cat ? ' dimmed' : '';
    return `
      <span class="pie-legend-item${dimClass}" data-category="${cat}">
        <span class="pie-legend-dot" style="background:${color}"></span>
        ${cat} <span class="pie-legend-pct">${pct}%</span>
      </span>`;
  }).join('');

  // Legend click handlers
  pieLegendEl.querySelectorAll('.pie-legend-item').forEach(item => {
    item.addEventListener('click', () => selectCategory(item.dataset.category));
  });
}

function updateSortIndicators() {
  document.querySelectorAll('.col-sortable').forEach(th => {
    const col = th.dataset.sort;
    const icon = th.querySelector('.sort-icon');
    if (col === sortColumn) {
      th.classList.add('sort-active');
      icon.textContent = sortDirection === 'asc' ? '▲' : '▼';
    } else {
      th.classList.remove('sort-active');
      icon.textContent = '';
    }
  });
}

function renderTransactionTable() {
  let filtered = getFullyFiltered();

  // Apply search filter
  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.date.includes(query) ||
      formatCurrency(t.amount).includes(query)
    );
  }

  rowCountEl.textContent = `${filtered.length} row${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    transactionBodyEl.innerHTML = `
      <tr class="empty-row">
        <td colspan="6" class="empty-msg">No records found.</td>
      </tr>`;
    return;
  }

  const dir = sortDirection === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortColumn) {
      case 'date':
        cmp = a.date.localeCompare(b.date);
        break;
      case 'category':
        cmp = a.category.localeCompare(b.category);
        break;
      case 'description':
        cmp = a.description.toLowerCase().localeCompare(b.description.toLowerCase());
        break;
      case 'amount':
        cmp = a.amount - b.amount;
        break;
    }
    return cmp * dir || b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
  });

  transactionBodyEl.innerHTML = sorted.map(t => {
    const color = (CATEGORIES[t.category] || CATEGORIES['Other']).color;
    const desc = query ? highlightMatch(escapeHtml(t.description), query) : escapeHtml(t.description);
    const cat = query ? highlightMatch(t.category, query) : t.category;
    const date = query ? highlightMatch(t.date, query) : t.date;
    const isIncome = t.type === 'income';
    const amtClass = isIncome ? 'cell-amt-income' : 'cell-amt';
    const amtPrefix = isIncome ? '+' : '-';
    return `
      <tr>
        <td class="cell-id">${t.id.slice(0, 8)}</td>
        <td class="cell-date">${date}</td>
        <td><span class="cell-cat"><span class="cell-cat-dot" style="background:${color}"></span>${cat}</span></td>
        <td class="cell-desc">${desc}</td>
        <td class="${amtClass}">${amtPrefix}${formatCurrency(t.amount)}</td>
        <td><div class="cell-actions"><button class="btn-edit" onclick="editTransaction('${t.id}')" title="Edit">✎</button><button class="btn-delete" onclick="deleteTransaction('${t.id}')" title="Delete">✕</button></div></td>
      </tr>`;
  }).join('');
}

// ========== Month Filter ==========
function populateMonthFilter() {
  const months = new Set(transactions.map(t => t.date.slice(0, 7)));
  const sorted = [...months].sort().reverse();
  const current = monthFilterEl.value;

  monthFilterEl.innerHTML = '<option value="all">ALL PERIODS</option>';
  sorted.forEach(m => {
    const [y, mo] = m.split('-');
    const label = `${y}-${mo}`;
    monthFilterEl.innerHTML += `<option value="${m}"${m === current ? ' selected' : ''}>${label}</option>`;
  });
}

// ========== Status Bar ==========
function setStatus(msg) {
  statusMsgEl.textContent = msg;
}

function updateClock() {
  const now = new Date();
  statusTimeEl.textContent = now.toLocaleString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }) + ' · ' + now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ========== Utilities ==========
function today() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return `${before}<mark class="search-highlight">${match}</mark>${after}`;
}

let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

// ========== Recurring Transactions ==========
function getNextDate(rule) {
  const now = today();
  const start = rule.startDate;
  const lastGen = rule.lastGenerated || null;

  if (rule.frequency === 'monthly') {
    const day = Math.min(rule.day, 28);
    // Find next occurrence from today
    const nowD = new Date(now + 'T00:00:00');
    let y = nowD.getFullYear(), m = nowD.getMonth();
    let candidate = new Date(y, m, day);
    if (candidate <= nowD) {
      m++;
      if (m > 11) { m = 0; y++; }
      candidate = new Date(y, m, day);
    }
    return candidate.toISOString().split('T')[0];
  }

  if (rule.frequency === 'weekly' || rule.frequency === 'biweekly') {
    const interval = rule.frequency === 'weekly' ? 7 : 14;
    const startD = new Date(start + 'T00:00:00');
    const nowD = new Date(now + 'T00:00:00');
    const diff = Math.floor((nowD - startD) / 86400000);
    const remainder = ((diff % interval) + interval) % interval;
    const daysUntil = remainder === 0 ? interval : interval - remainder;
    const next = new Date(nowD);
    next.setDate(next.getDate() + daysUntil);
    return next.toISOString().split('T')[0];
  }

  return now;
}

function getDueDates(rule) {
  const todayStr = today();
  const todayD = new Date(todayStr + 'T00:00:00');
  const startD = new Date(rule.startDate + 'T00:00:00');
  const lastGenD = rule.lastGenerated ? new Date(rule.lastGenerated + 'T00:00:00') : null;
  const dates = [];

  if (rule.frequency === 'monthly') {
    const day = Math.min(rule.day, 28);
    let y = startD.getFullYear(), m = startD.getMonth();
    // If start day > day, start from next month
    if (startD.getDate() > day) { m++; if (m > 11) { m = 0; y++; } }

    for (let i = 0; i < 120; i++) { // safety cap
      const d = new Date(y, m, day);
      if (d > todayD) break;
      if (d >= startD && (!lastGenD || d > lastGenD)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      m++;
      if (m > 11) { m = 0; y++; }
    }
  } else {
    const interval = rule.frequency === 'weekly' ? 7 : 14;
    const d = new Date(startD);
    for (let i = 0; i < 500; i++) { // safety cap
      if (d > todayD) break;
      if (!lastGenD || d > lastGenD) {
        dates.push(d.toISOString().split('T')[0]);
      }
      d.setDate(d.getDate() + interval);
    }
  }

  return dates;
}

async function autoGenerateRecurring() {
  let totalGenerated = 0;
  const allNew = [];
  const updatedRules = [];

  for (const rule of recurringRules) {
    const dates = getDueDates(rule);
    if (dates.length === 0) continue;

    dates.forEach((date, i) => {
      allNew.push({
        id: 'rec' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + i.toString(36),
        description: rule.description,
        amount: rule.amount,
        category: rule.category,
        date,
        type: rule.type || 'expense',
      });
    });

    rule.lastGenerated = dates[dates.length - 1];
    updatedRules.push(rule);
    totalGenerated += dates.length;
  }

  if (allNew.length > 0) {
    try {
      await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allNew),
      });
      transactions = await apiGet();

      for (const rule of updatedRules) {
        await apiUpdateRecurring(rule);
      }
    } catch (err) {
      console.error('Auto-generate failed:', err);
    }
  }

  return totalGenerated;
}

function renderRecurringList() {
  if (recurringRules.length === 0) {
    recurringListEl.innerHTML = '<div class="empty-msg">No recurring rules.</div>';
    return;
  }

  const freqLabels = { monthly: 'MO', biweekly: '2W', weekly: 'WK' };

  recurringListEl.innerHTML = recurringRules.map(r => {
    const freq = freqLabels[r.frequency] || r.frequency;
    const next = getNextDate(r);
    const isIncome = r.type === 'income';
    const amtClass = isIncome ? 'rec-amount-income' : 'rec-amount';
    const amtPrefix = isIncome ? '+' : '-';
    return `
      <div class="rec-row" data-id="${r.id}">
        <div class="rec-info" onclick="openEditRecurring('${r.id}')">
          <div class="rec-desc">${escapeHtml(r.description)}</div>
          <div class="rec-meta">
            <span class="rec-freq-badge">${freq}</span>
            <span class="rec-next">next: ${next}</span>
          </div>
        </div>
        <span class="${amtClass}">${amtPrefix}${formatCurrency(r.amount)}</span>
        <div class="rec-actions">
          <button class="rec-delete" onclick="deleteRecurring('${r.id}')" title="Delete rule">✕</button>
        </div>
      </div>`;
  }).join('');
}

function openAddRecurring() {
  editingRecurringId = null;
  recurringModalTitle.textContent = 'ADD RECURRING';
  recSubmitBtn.textContent = 'ADD RULE';
  recurringForm.reset();
  recStartInput.value = today();
  recDayInput.value = new Date().getDate();
  setRecType('expense');
  updateDayLabel();
  recurringModal.classList.remove('hidden');
  recDescInput.focus();
}

function openEditRecurring(id) {
  const rule = recurringRules.find(r => r.id === id);
  if (!rule) return;

  editingRecurringId = id;
  recurringModalTitle.textContent = 'EDIT RECURRING';
  recSubmitBtn.textContent = 'SAVE CHANGES';
  recDescInput.value = rule.description;
  recAmountInput.value = rule.amount;
  recCategoryInput.value = rule.category;
  recFrequencyInput.value = rule.frequency;
  recDayInput.value = rule.day;
  recStartInput.value = rule.startDate;
  setRecType(rule.type || 'expense');
  updateDayLabel();
  recurringModal.classList.remove('hidden');
  recDescInput.focus();
}

async function handleSaveRecurring(e) {
  e.preventDefault();

  const rule = {
    id: editingRecurringId || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    description: recDescInput.value.trim(),
    amount: parseFloat(parseFloat(recAmountInput.value).toFixed(2)),
    category: recCategoryInput.value,
    frequency: recFrequencyInput.value,
    day: parseInt(recDayInput.value),
    startDate: recStartInput.value,
    type: recType,
    lastGenerated: null,
  };

  try {
    if (editingRecurringId) {
      const existing = recurringRules.find(r => r.id === editingRecurringId);
      if (existing) rule.lastGenerated = existing.lastGenerated;
      await apiUpdateRecurring(rule);
      const idx = recurringRules.findIndex(r => r.id === editingRecurringId);
      if (idx !== -1) recurringRules[idx] = rule;
      setStatus(`UPDATE RECURRING → ${escapeHtml(rule.description)}`);
      showToast('Recurring rule updated');
    } else {
      await apiSaveRecurring(rule);
      recurringRules.push(rule);

      // Auto-generate any due transactions for the new rule
      const dates = getDueDates(rule);
      if (dates.length > 0) {
        const newTxns = dates.map((date, i) => ({
          id: 'rec' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + i.toString(36),
          description: rule.description,
          amount: rule.amount,
          category: rule.category,
          date,
          type: rule.type || 'expense',
        }));
        await fetch('/api/transactions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTxns),
        });
        rule.lastGenerated = dates[dates.length - 1];
        await apiUpdateRecurring(rule);
        transactions = await apiGet();
        populateMonthFilter();
        render();
        showToast(`Added rule + ${dates.length} past transaction${dates.length !== 1 ? 's' : ''}`);
      } else {
        showToast('Recurring rule added');
      }
      setStatus(`ADD RECURRING → ${escapeHtml(rule.description)} (${rule.frequency})`);
    }

    closeRecurringModal();
    renderRecurringList();
  } catch (err) {
    showToast('Failed — check server');
    console.error(err);
  }
}

async function deleteRecurring(id) {
  try {
    await apiDeleteRecurring(id);
    recurringRules = recurringRules.filter(r => r.id !== id);
    renderRecurringList();
    setStatus(`DELETE RECURRING → ${id}`);
    showToast('Recurring rule deleted');
  } catch (err) {
    showToast('Delete failed — check server');
    console.error(err);
  }
}

function closeRecurringModal() {
  recurringModal.classList.add('hidden');
  editingRecurringId = null;
}

function updateDayLabel() {
  const label = recDayInput.previousElementSibling;
  if (recFrequencyInput.value === 'monthly') {
    label.textContent = 'DAY OF MONTH';
    recDayInput.max = 31;
    recDayInput.placeholder = '1';
  } else {
    label.textContent = 'DAY (unused)';
    recDayInput.max = 31;
  }
}

// ========== Edit Transaction ==========
function editTransaction(id) {
  const t = transactions.find(tx => tx.id === id);
  if (!t) return;

  editingTransactionId = id;
  editIdEl.textContent = `ID: ${id}`;
  editDescInput.value = t.description;
  editAmountInput.value = t.amount;
  editDateInput.value = t.date;
  editCategoryInput.value = t.category;
  setEditType(t.type || 'expense');

  editModal.classList.remove('hidden');
  editDescInput.focus();
}

async function handleSaveEdit(e) {
  e.preventDefault();
  if (!editingTransactionId) return;

  const updated = {
    id: editingTransactionId,
    description: editDescInput.value.trim(),
    amount: parseFloat(parseFloat(editAmountInput.value).toFixed(2)),
    category: editCategoryInput.value,
    date: editDateInput.value,
    type: editType,
  };

  try {
    const res = await fetch('/api/transactions/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error('Update failed');

    // Update local state
    const idx = transactions.findIndex(t => t.id === editingTransactionId);
    if (idx !== -1) transactions[idx] = updated;

    closeEditModal();
    populateMonthFilter();
    render();
    setStatus(`UPDATE → ${escapeHtml(updated.description)} (${formatCurrency(updated.amount)})`);
    showToast('Record updated');
  } catch (err) {
    showToast('Update failed — check server');
    console.error(err);
  }
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingTransactionId = null;
}

// ========== Tab Switching ==========
function switchTab(tab) {
  tabLogBtn.classList.toggle('active', tab === 'log');
  tabAnalyticsBtn.classList.toggle('active', tab === 'analytics');
  tabContentLog.classList.toggle('active', tab === 'log');
  tabContentAnalytics.classList.toggle('active', tab === 'analytics');
  searchWrap.style.display = tab === 'log' ? '' : 'none';
  document.getElementById('rowCount').style.display = tab === 'log' ? '' : 'none';
  if (tab === 'analytics') renderAnalytics();
}

// ========== Analytics ==========
const tooltipEl = document.getElementById('chartTooltip');

function showTooltipAt(e, html) {
  tooltipEl.innerHTML = html;
  tooltipEl.classList.add('visible');
  const rect = tooltipEl.getBoundingClientRect();
  tooltipEl.style.left = (e.clientX - rect.width / 2) + 'px';
  tooltipEl.style.top = (e.clientY - rect.height - 12) + 'px';
}

function hideTooltip() {
  tooltipEl.classList.remove('visible');
}

function renderAnalytics() {
  renderCategoryPicker();
  renderCashflowChart();
  renderTopExpenses();
  renderCategoryTrends();
}

function getMonthlyBuckets() {
  const buckets = {};
  transactions.forEach(t => {
    const key = t.date.slice(0, 7);
    if (!buckets[key]) buckets[key] = { expenses: 0, income: 0 };
    if (t.type === 'income') {
      buckets[key].income += t.amount;
    } else {
      buckets[key].expenses += t.amount;
    }
  });
  return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
}

// ---- SVG Helpers ----
function svgLine(points, labels, color, w, h, pad, maxVal, addArea) {
  if (points.length === 0) return '';
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;
  const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;

  const coords = points.map((val, i) => ({
    x: pad.l + stepX * i,
    y: pad.t + chartH - (val / maxVal) * chartH,
    val, label: labels ? labels[i] : '',
  }));

  let path = 'M' + coords[0].x + ',' + coords[0].y;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ' C' + cpx + ',' + prev.y + ' ' + cpx + ',' + curr.y + ' ' + curr.x + ',' + curr.y;
  }

  let svg = '';
  if (addArea) {
    const areaPath = path + ' L' + coords[coords.length-1].x + ',' + (pad.t + chartH) + ' L' + coords[0].x + ',' + (pad.t + chartH) + ' Z';
    svg += '<path class="data-area" d="' + areaPath + '" fill="' + color + '"/>';
  }
  svg += '<path class="data-line" d="' + path + '" stroke="' + color + '"/>';

  coords.forEach(c => {
    svg += '<circle class="data-dot" cx="' + c.x + '" cy="' + c.y + '" r="3.5" fill="var(--bg-surface)" stroke="' + color + '" data-tip-val="' + formatCurrency(c.val) + '" data-tip-label="' + c.label + '"/>';
  });

  return svg;
}

function svgGrid(w, h, pad, maxVal, steps) {
  const chartH = h - pad.t - pad.b;
  let svg = '';
  for (let i = 0; i <= steps; i++) {
    const y = pad.t + (chartH / steps) * i;
    const val = maxVal - (maxVal / steps) * i;
    svg += '<line class="grid-line" x1="' + pad.l + '" y1="' + y + '" x2="' + (w - pad.r) + '" y2="' + y + '"/>';
    svg += '<text class="axis-label" x="' + (pad.l - 6) + '" y="' + (y + 3) + '" text-anchor="end">$' + Math.round(val) + '</text>';
  }
  return svg;
}

function attachDotTooltips(container) {
  container.querySelectorAll('.data-dot').forEach(dot => {
    dot.addEventListener('mouseenter', e => {
      const val = dot.getAttribute('data-tip-val');
      const label = dot.getAttribute('data-tip-label');
      const html = (label ? '<span class="chart-tooltip-label">' + label + '</span><br>' : '') + val;
      showTooltipAt(e, html);
    });
    dot.addEventListener('mousemove', e => {
      const rect = tooltipEl.getBoundingClientRect();
      tooltipEl.style.left = (e.clientX - rect.width / 2) + 'px';
      tooltipEl.style.top = (e.clientY - rect.height - 12) + 'px';
    });
    dot.addEventListener('mouseleave', hideTooltip);
  });
}

// ---- Cashflow SVG Bar Chart ----
function renderCashflowChart() {
  const el = document.getElementById('chartCashflow');
  const months = getMonthlyBuckets().slice(-12);
  const rangeEl = document.getElementById('cashflowRange');

  if (months.length === 0) {
    el.innerHTML = '<div class="empty-msg">No data yet.</div>';
    rangeEl.textContent = '';
    return;
  }

  rangeEl.textContent = months[0][0] + ' \u2014 ' + months[months.length - 1][0];
  const maxVal = Math.max(...months.map(([, d]) => Math.max(d.expenses, d.income)), 1) * 1.1;

  const w = 640, h = 180;
  const pad = { t: 12, r: 16, b: 28, l: 52 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;
  const n = months.length;
  const groupW = chartW / n;
  const barW = Math.min(Math.max(groupW * 0.28, 4), 14);
  const gap = Math.max(barW * 0.3, 2);

  let svg = '<svg class="chart-svg" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (chartH / 4) * i;
    const val = maxVal - (maxVal / 4) * i;
    svg += '<line class="grid-line" x1="' + pad.l + '" y1="' + y + '" x2="' + (w - pad.r) + '" y2="' + y + '"/>';
    if (i < 4) {
      svg += '<text class="axis-label" x="' + (pad.l - 6) + '" y="' + (y + 3) + '" text-anchor="end">$' + Math.round(val) + '</text>';
    }
  }
  // Baseline
  svg += '<line x1="' + pad.l + '" y1="' + (pad.t + chartH) + '" x2="' + (w - pad.r) + '" y2="' + (pad.t + chartH) + '" stroke="var(--border)" stroke-width="1"/>';

  // Bars + labels
  months.forEach(([month, data], i) => {
    const cx = pad.l + groupW * i + groupW / 2;
    const incH = (data.income / maxVal) * chartH;
    const expH = (data.expenses / maxVal) * chartH;

    // Income bar
    if (data.income > 0) {
      const x = cx - gap / 2 - barW;
      const y = pad.t + chartH - incH;
      svg += '<rect class="cf-svg-bar" x="' + x + '" y="' + y + '" width="' + barW + '" height="' + incH + '" rx="2" fill="var(--green)" opacity="0.65"' +
        ' data-month="' + month + '" data-type="Income" data-val="' + formatCurrency(data.income) + '"/>';
    }

    // Expense bar
    if (data.expenses > 0) {
      const x = cx + gap / 2;
      const y = pad.t + chartH - expH;
      svg += '<rect class="cf-svg-bar" x="' + x + '" y="' + y + '" width="' + barW + '" height="' + expH + '" rx="2" fill="var(--red)" opacity="0.65"' +
        ' data-month="' + month + '" data-type="Expenses" data-val="' + formatCurrency(data.expenses) + '"/>';
    }

    // Month label
    svg += '<text class="axis-label" x="' + cx + '" y="' + (h - 8) + '" text-anchor="middle">' + month.slice(5) + '</text>';
  });

  svg += '</svg>';

  // Legend
  svg += '<div class="cf-legend">' +
    '<span><span class="cf-legend-dot" style="background:var(--green)"></span>Income</span>' +
    '<span><span class="cf-legend-dot" style="background:var(--red)"></span>Expenses</span>' +
  '</div>';

  el.innerHTML = svg;

  // Tooltips
  el.querySelectorAll('.cf-svg-bar').forEach(bar => {
    bar.addEventListener('mouseenter', e => {
      showTooltipAt(e, '<span class="chart-tooltip-label">' + bar.dataset.month + '</span><br>' + bar.dataset.type + ': ' + bar.dataset.val);
    });
    bar.addEventListener('mousemove', e => {
      const rect = tooltipEl.getBoundingClientRect();
      tooltipEl.style.left = (e.clientX - rect.width / 2) + 'px';
      tooltipEl.style.top = (e.clientY - rect.height - 12) + 'px';
    });
    bar.addEventListener('mouseleave', hideTooltip);
  });
}

// ---- Top Expenses ----
function renderTopExpenses() {
  const el = document.getElementById('chartTopExpenses');
  const expenses = transactions
    .filter(t => (t.type || 'expense') === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  if (expenses.length === 0) {
    el.innerHTML = '<div class="empty-msg">No expenses yet.</div>';
    return;
  }

  const maxAmt = expenses[0].amount;

  el.innerHTML = expenses.map((t, i) => {
    const pct = (t.amount / maxAmt) * 100;
    const color = (CATEGORIES[t.category] || CATEGORIES['Other']).color;
    return '<div class="te-row">' +
      '<span class="te-rank">#' + (i + 1) + '</span>' +
      '<div class="te-bar-track">' +
        '<div class="te-bar-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
        '<span class="te-bar-label">' + escapeHtml(t.description) + '</span>' +
      '</div>' +
      '<span class="te-date">' + t.date + '</span>' +
      '<span class="te-amount">-' + formatCurrency(t.amount) + '</span>' +
    '</div>';
  }).join('');
}

// ---- Category Trends ----
function renderCategoryTrends() {
  const el = document.getElementById('chartCategoryTrends');
  const allMonths = getMonthlyBuckets().slice(-6);

  if (allMonths.length < 2) {
    el.innerHTML = '<div class="empty-msg">Need at least 2 months of data.</div>';
    return;
  }

  const monthKeys = allMonths.map(function(b) { return b[0]; });
  const catMonthly = {};
  transactions.filter(t => (t.type || 'expense') === 'expense').forEach(t => {
    const m = t.date.slice(0, 7);
    if (!monthKeys.includes(m)) return;
    if (!catMonthly[t.category]) catMonthly[t.category] = {};
    if (!catMonthly[t.category][m]) catMonthly[t.category][m] = 0;
    catMonthly[t.category][m] += t.amount;
  });

  const topCats = Object.entries(catMonthly)
    .map(function(e) { return [e[0], Object.values(e[1]).reduce(function(a,b){return a+b},0)]; })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(function(e) { return e[0]; });

  const maxVal = Math.max(
    ...topCats.flatMap(cat => monthKeys.map(m => catMonthly[cat]?.[m] || 0)), 1
  );

  const w = 620, h = 200;
  const pad = { t: 14, r: 20, b: 30, l: 50 };
  const chartW = w - pad.l - pad.r;
  const stepX = monthKeys.length > 1 ? chartW / (monthKeys.length - 1) : chartW;

  let svg = '<svg class="chart-svg" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
  svg += svgGrid(w, h, pad, maxVal, 4);

  monthKeys.forEach((m, i) => {
    const x = pad.l + stepX * i;
    svg += '<text class="axis-label" x="' + x + '" y="' + (h - 6) + '" text-anchor="middle">' + m.slice(5) + '</text>';
  });

  topCats.forEach(cat => {
    const color = (CATEGORIES[cat] || CATEGORIES['Other']).color;
    const points = monthKeys.map(m => catMonthly[cat]?.[m] || 0);
    svg += svgLine(points, monthKeys.map(m => cat + ' \u00B7 ' + m), color, w, h, pad, maxVal, true);
  });

  svg += '</svg>';

  const legend = topCats.map(cat => {
    const color = (CATEGORIES[cat] || CATEGORIES['Other']).color;
    return '<span class="ct-legend-item"><span class="ct-legend-dot" style="background:' + color + '"></span>' + cat + '</span>';
  }).join('');

  el.innerHTML = svg + '<div class="ct-legend">' + legend + '</div>';
  attachDotTooltips(el);
}

// ---- Category Picker ----
let activeDDCategory = null;

function renderCategoryPicker() {
  const el = document.getElementById('chartCategoryPicker');
  const catTotals = {};
  transactions.filter(t => (t.type || 'expense') === 'expense').forEach(t => {
    if (!catTotals[t.category]) catTotals[t.category] = 0;
    catTotals[t.category] += t.amount;
  });

  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    el.innerHTML = '<div class="empty-msg">No expense data.</div>';
    return;
  }

  el.innerHTML = '<div class="cat-picker-grid">' + sorted.map(function(entry) {
    const cat = entry[0], total = entry[1];
    const color = (CATEGORIES[cat] || CATEGORIES['Other']).color;
    const isActive = activeDDCategory === cat;
    const cls = isActive ? 'cat-picker-btn cat-picker-active' : 'cat-picker-btn';
    return '<button class="' + cls + '" data-cat="' + cat + '" style="' + (isActive ? 'border-color:' + color + ';background:var(--bg-hover)' : '') + '">' +
      '<span class="cat-picker-dot" style="background:' + color + '"></span>' +
      cat +
      '<span class="cat-picker-amt">' + formatCurrency(total) + '</span>' +
    '</button>';
  }).join('') + '</div>';

  el.querySelectorAll('.cat-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (activeDDCategory === cat) {
        activeDDCategory = null;
        document.getElementById('deepDiveInline').innerHTML = '';
        renderCategoryPicker();
      } else {
        activeDDCategory = cat;
        renderCategoryPicker();
        renderDeepDive(cat);
      }
    });
  });
}

// ---- Deep Dive Inline ----
function renderDeepDive(category) {
  const el = document.getElementById('deepDiveInline');
  const color = (CATEGORIES[category] || CATEGORIES['Other']).color;
  const catTxns = transactions.filter(t => t.category === category && (t.type || 'expense') === 'expense');

  if (catTxns.length === 0) {
    el.innerHTML = '<div class="empty-msg">No transactions.</div>';
    return;
  }

  const total = catTxns.reduce((s, t) => s + t.amount, 0);
  const avg = total / catTxns.length;
  const max = Math.max(...catTxns.map(t => t.amount));
  const min = Math.min(...catTxns.map(t => t.amount));

  // Monthly trend
  const monthlyData = {};
  catTxns.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!monthlyData[m]) monthlyData[m] = 0;
    monthlyData[m] += t.amount;
  });
  const monthKeys = Object.keys(monthlyData).sort().slice(-12);
  const monthVals = monthKeys.map(m => monthlyData[m]);
  const maxMonthVal = Math.max(...monthVals, 1);

  const w = 580, h = 150;
  const pad = { t: 12, r: 20, b: 28, l: 50 };
  const stepX = monthKeys.length > 1 ? (w - pad.l - pad.r) / (monthKeys.length - 1) : 0;

  let trendSvg = '<svg class="chart-svg" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
  trendSvg += svgGrid(w, h, pad, maxMonthVal, 3);
  monthKeys.forEach((m, i) => {
    const x = pad.l + stepX * i;
    trendSvg += '<text class="axis-label" x="' + x + '" y="' + (h - 6) + '" text-anchor="middle">' + m.slice(5) + '</text>';
  });
  trendSvg += svgLine(monthVals, monthKeys, color, w, h, pad, maxMonthVal, true);
  trendSvg += '</svg>';

  // Top 5 + Recent 8
  const top5 = [...catTxns].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const top5Max = top5[0].amount;
  const recent = [...catTxns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  el.innerHTML =
    '<div class="dd-title-bar">' +
      '<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:' + color + '"></span>' +
      '<span class="dd-title-text">' + category + '</span>' +
      '<button class="dd-clear-btn" id="ddClearBtn">CLOSE \u2715</button>' +
    '</div>' +

    '<div class="dd-stats">' +
      '<div class="dd-stat"><span class="dd-stat-label">TOTAL</span><span class="dd-stat-value" style="color:' + color + '">' + formatCurrency(total) + '</span></div>' +
      '<div class="dd-stat"><span class="dd-stat-label">COUNT</span><span class="dd-stat-value">' + catTxns.length + '</span></div>' +
      '<div class="dd-stat"><span class="dd-stat-label">AVERAGE</span><span class="dd-stat-value">' + formatCurrency(avg) + '</span></div>' +
      '<div class="dd-stat"><span class="dd-stat-label">RANGE</span><span class="dd-stat-value" style="font-size:14px">' + formatCurrency(min) + ' \u2013 ' + formatCurrency(max) + '</span></div>' +
    '</div>' +

    '<div class="dd-section">' +
      '<div class="dd-section-title">MONTHLY TREND</div>' +
      trendSvg +
    '</div>' +

    '<div class="dd-columns">' +
      '<div class="dd-section">' +
        '<div class="dd-section-title">LARGEST</div>' +
        top5.map(function(t, i) {
          const pct = (t.amount / top5Max) * 100;
          return '<div class="te-row">' +
            '<span class="te-rank">#' + (i+1) + '</span>' +
            '<div class="te-bar-track"><div class="te-bar-fill" style="width:' + pct + '%;background:' + color + '"></div><span class="te-bar-label">' + escapeHtml(t.description) + '</span></div>' +
            '<span class="te-amount">-' + formatCurrency(t.amount) + '</span></div>';
        }).join('') +
      '</div>' +
      '<div class="dd-section">' +
        '<div class="dd-section-title">RECENT</div>' +
        recent.map(function(t) {
          return '<div class="te-row"><span class="te-date">' + t.date.slice(5) + '</span>' +
            '<div class="te-bar-track" style="background:transparent"><span class="te-bar-label" style="position:static;transform:none">' + escapeHtml(t.description) + '</span></div>' +
            '<span class="te-amount">-' + formatCurrency(t.amount) + '</span></div>';
        }).join('') +
      '</div>' +
    '</div>';

  attachDotTooltips(el);

  document.getElementById('ddClearBtn').addEventListener('click', () => {
    activeDDCategory = null;
    el.innerHTML = '';
    renderCategoryPicker();
  });
}

// ========== Export CSV ==========
function handleExportCsv() {
  const filtered = getFullyFiltered();

  // Apply search filter too
  const query = searchInput.value.trim().toLowerCase();
  let data = filtered;
  if (query) {
    data = data.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.date.includes(query) ||
      formatCurrency(t.amount).includes(query)
    );
  }

  if (data.length === 0) {
    showToast('No records to export');
    return;
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = sorted.map(t => {
    const type = t.type || 'expense';
    return [
      t.date,
      type,
      '"' + t.category.replace(/"/g, '""') + '"',
      '"' + t.description.replace(/"/g, '""') + '"',
      (type === 'income' ? '' : '-') + t.amount.toFixed(2),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spendwise_${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  setStatus(`EXPORT → ${sorted.length} records`);
  showToast(`Exported ${sorted.length} records`);
}

// ========== CSV Import ==========
const VALID_CATEGORIES = Object.keys(CATEGORIES);

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let inQuotes = false;
    let cell = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { cell += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',' || ch === '\t') { row.push(cell.trim()); cell = ''; }
        else { cell += ch; }
      }
    }
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

// Heuristic: guess which field a column header maps to
function guessField(header) {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(desc|description|memo|note|label|merchant|payee|name|vendor|detail)/.test(h)) return 'description';
  if (/^(amt|amount|value|total|price|cost|sum|debit|credit|charge)/.test(h)) return 'amount';
  if (/^(cat|category|type|group|class)/.test(h)) return 'category';
  if (/^(date|time|when|posted|transdate|transactiondate)/.test(h)) return 'date';
  return 'skip';
}

// Try to detect if a column contains dates, amounts, etc. from sample values
function guessFieldFromValues(values) {
  const samples = values.filter(v => v).slice(0, 10);
  if (samples.length === 0) return 'skip';
  const dateCount = samples.filter(v => !isNaN(Date.parse(v)) && /[\-\/]/.test(v)).length;
  if (dateCount > samples.length * 0.6) return 'date';
  const numCount = samples.filter(v => !isNaN(parseFloat(v.replace(/[$,]/g, '')))).length;
  if (numCount > samples.length * 0.6) return 'amount';
  return null; // ambiguous
}

function handleCsvFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  csvFileInput.value = '';

  const reader = new FileReader();
  reader.onload = (ev) => {
    const rows = parseCSV(ev.target.result);
    if (rows.length < 2) {
      showToast('CSV has no data rows');
      return;
    }

    csvHeaders = rows[0];
    csvParsedRows = rows.slice(1).filter(r => r.some(c => c)); // skip empty rows

    csvFileName.textContent = file.name;
    csvFileMeta.textContent = `${csvHeaders.length} columns · ${csvParsedRows.length} rows`;

    // Auto-detect mappings
    csvColumnMappings = {};
    const usedFields = new Set();

    // First pass: match by header name
    csvHeaders.forEach((h, i) => {
      const guess = guessField(h);
      if (guess !== 'skip' && !usedFields.has(guess)) {
        csvColumnMappings[i] = guess;
        usedFields.add(guess);
      }
    });

    // Second pass: try value-based detection for unmapped columns
    csvHeaders.forEach((h, i) => {
      if (csvColumnMappings[i]) return;
      const colValues = csvParsedRows.map(r => r[i] || '');
      const guess = guessFieldFromValues(colValues);
      if (guess && !usedFields.has(guess)) {
        csvColumnMappings[i] = guess;
        usedFields.add(guess);
      }
    });

    buildMappingUI();
    csvCategoryMap = {};
    updateCatMapping();

    csvStep1.classList.remove('hidden');
    csvStep2.classList.add('hidden');
    csvModal.classList.remove('hidden');
  };
  reader.readAsText(file);
}

function buildMappingUI() {
  const fields = ['skip', 'description', 'amount', 'category', 'date'];
  csvMappingTable.innerHTML = csvHeaders.map((header, i) => {
    const samples = csvParsedRows.slice(0, 3).map(r => r[i] || '—').join(', ');
    const current = csvColumnMappings[i] || 'skip';
    const options = fields.map(f =>
      `<option value="${f}"${f === current ? ' selected' : ''}>${f.toUpperCase()}</option>`
    ).join('');
    return `
      <div class="csv-map-row">
        <div class="csv-map-col-name">
          <span>${escapeHtml(header)}</span>
          <span class="csv-map-sample">${escapeHtml(samples)}</span>
        </div>
        <span class="csv-map-arrow">→</span>
        <select data-col="${i}">${options}</select>
      </div>`;
  }).join('');

  // Listen for changes
  csvMappingTable.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      const col = parseInt(sel.dataset.col);
      const val = sel.value;

      // Prevent duplicate field assignments (except skip)
      if (val !== 'skip') {
        csvMappingTable.querySelectorAll('select').forEach(other => {
          if (other !== sel && other.value === val) {
            other.value = 'skip';
            csvColumnMappings[parseInt(other.dataset.col)] = 'skip';
          }
        });
      }

      csvColumnMappings[col] = val;
      updateCatMapping();
    });
  });
}

function updateCatMapping() {
  // Find which column is mapped to category
  const catColIndex = Object.keys(csvColumnMappings).find(k => csvColumnMappings[k] === 'category');

  if (catColIndex === undefined) {
    csvCatMapping.innerHTML = '<div class="empty-msg">No category column mapped.</div>';
    csvCatMapping.classList.add('empty-cats');
    return;
  }

  // Collect unique category values
  const rawCats = new Set();
  csvParsedRows.forEach(r => {
    const val = (r[catColIndex] || '').trim();
    if (val) rawCats.add(val);
  });

  // Check which ones don't directly match a SpendWise category
  const unmatched = [...rawCats].filter(c => !VALID_CATEGORIES.includes(c));

  if (unmatched.length === 0) {
    csvCatMapping.innerHTML = '<div class="empty-msg">All categories match — no mapping needed.</div>';
    csvCatMapping.classList.add('empty-cats');
    csvCategoryMap = {};
    return;
  }

  csvCatMapping.classList.remove('empty-cats');
  const catOptions = VALID_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');

  csvCatMapping.innerHTML = unmatched.map(orig => {
    // Try fuzzy match
    const bestGuess = fuzzyMatchCategory(orig);
    const savedMap = csvCategoryMap[orig];
    const selected = savedMap || bestGuess;
    const options = VALID_CATEGORIES.map(c =>
      `<option value="${c}"${c === selected ? ' selected' : ''}>${c}</option>`
    ).join('');
    return `
      <div class="csv-cat-row">
        <span class="csv-cat-original">${escapeHtml(orig)}</span>
        <span class="csv-map-arrow">→</span>
        <select data-orig="${escapeHtml(orig)}">${options}</select>
      </div>`;
  }).join('');

  // Update map from selections
  csvCatMapping.querySelectorAll('select').forEach(sel => {
    const orig = sel.dataset.orig;
    csvCategoryMap[orig] = sel.value;
    sel.addEventListener('change', () => { csvCategoryMap[orig] = sel.value; });
  });
  // Also set defaults for the fuzzy matches
  unmatched.forEach(orig => {
    if (!csvCategoryMap[orig]) csvCategoryMap[orig] = fuzzyMatchCategory(orig);
  });
}

function fuzzyMatchCategory(input) {
  const lower = input.toLowerCase();
  // Simple keyword matching
  const keywords = {
    'Food & Dining': ['food', 'dining', 'restaurant', 'grocery', 'groceries', 'meal', 'eat', 'coffee', 'lunch', 'dinner', 'breakfast', 'cafe'],
    'Transportation': ['transport', 'gas', 'fuel', 'uber', 'lyft', 'taxi', 'car', 'auto', 'parking', 'transit', 'bus', 'train'],
    'Shopping': ['shop', 'retail', 'amazon', 'clothing', 'clothes', 'merchandise', 'purchase', 'store'],
    'Entertainment': ['entertainment', 'movie', 'game', 'streaming', 'netflix', 'spotify', 'concert', 'fun', 'recreation'],
    'Bills & Utilities': ['bill', 'utility', 'utilities', 'electric', 'water', 'internet', 'phone', 'rent', 'mortgage', 'insurance'],
    'Health': ['health', 'medical', 'doctor', 'pharmacy', 'dental', 'hospital', 'fitness', 'gym', 'wellness'],
    'Education': ['education', 'school', 'tuition', 'book', 'course', 'class', 'training', 'learn'],
    'Travel': ['travel', 'hotel', 'flight', 'airfare', 'vacation', 'trip', 'lodging', 'airline'],
    'Personal Care': ['personal', 'care', 'beauty', 'haircut', 'salon', 'spa', 'grooming', 'hygiene'],
    'Paycheck / Salary': ['paycheck', 'salary', 'wage', 'income', 'payroll', 'direct deposit', 'compensation', 'bonus'],
  };

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return 'Other';
}

function parseAmount(val) {
  if (!val) return NaN;
  const cleaned = val.replace(/[$,\s]/g, '').replace(/\((.+)\)/, '-$1');
  return parseFloat(cleaned);
}

function parseDate(val) {
  if (!val) return null;
  const v = val.trim();

  // Try ISO: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)) return v;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // MM/DD/YY
  const mdy2 = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (mdy2) {
    const [, m, d, y] = mdy2;
    const fullYear = parseInt(y) > 50 ? '19' + y : '20' + y;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: try Date.parse
  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

function buildMappedTransactions() {
  const colFor = {};
  for (const [i, field] of Object.entries(csvColumnMappings)) {
    if (field !== 'skip') colFor[field] = parseInt(i);
  }

  // Build lookup of existing transactions for duplicate detection
  const existingKeys = new Set();
  transactions.forEach(t => {
    existingKeys.add(`${t.date}|${t.description.toLowerCase()}|${t.amount.toFixed(2)}`);
  });

  const results = [];
  csvParsedRows.forEach((row, idx) => {
    const rawDesc = colFor.description !== undefined ? (row[colFor.description] || '').trim() : '';
    const rawAmt = colFor.amount !== undefined ? (row[colFor.amount] || '') : '';
    const rawCat = colFor.category !== undefined ? (row[colFor.category] || '').trim() : '';
    const rawDate = colFor.date !== undefined ? (row[colFor.date] || '') : '';

    const amount = parseAmount(rawAmt);
    const date = parseDate(rawDate);

    // Resolve category
    let category = rawCat;
    if (csvCategoryMap[rawCat]) {
      category = csvCategoryMap[rawCat];
    } else if (!VALID_CATEGORIES.includes(rawCat)) {
      category = 'Other';
    }

    const errors = [];
    if (!rawDesc) errors.push('no description');
    if (isNaN(amount) || amount === 0) errors.push('invalid amount');
    if (!date) errors.push('invalid date');

    const parsedAmount = isNaN(amount) ? 0 : Math.abs(amount);
    const parsedDate = date || today();
    const parsedDesc = rawDesc || '(empty)';

    // Duplicate check
    const key = `${parsedDate}|${parsedDesc.toLowerCase()}|${parsedAmount.toFixed(2)}`;
    const isDuplicate = errors.length === 0 && existingKeys.has(key);

    results.push({
      rowIndex: idx,
      description: parsedDesc,
      amount: parsedAmount,
      category,
      date: parsedDate,
      errors,
      valid: errors.length === 0,
      isDuplicate,
      include: !isDuplicate, // duplicates unchecked by default, others checked
    });
  });

  return results;
}

function showCsvPreview() {
  // Validate that required fields are mapped
  const mapped = new Set(Object.values(csvColumnMappings).filter(v => v !== 'skip'));
  if (!mapped.has('description') && !mapped.has('amount')) {
    showToast('Map at least description and amount');
    return;
  }

  csvMappedTransactions = buildMappedTransactions();

  const validCount = csvMappedTransactions.filter(t => t.valid).length;
  const dupeCount = csvMappedTransactions.filter(t => t.isDuplicate).length;
  const errorCount = csvMappedTransactions.filter(t => !t.valid).length;

  let metaParts = [`${validCount} valid`];
  if (dupeCount > 0) metaParts.push(`${dupeCount} duplicate${dupeCount !== 1 ? 's' : ''}`);
  if (errorCount > 0) metaParts.push(`${errorCount} with errors`);
  metaParts.push(`${csvMappedTransactions.length} total`);
  csvPreviewMeta.textContent = metaParts.join(' · ');

  renderCsvPreviewRows();
  updateCsvImportCount();

  // Select-all checkbox
  const selectAll = document.getElementById('csvSelectAll');
  selectAll.checked = csvMappedTransactions.filter(t => t.valid).every(t => t.include);
  selectAll.addEventListener('change', () => {
    const checked = selectAll.checked;
    csvMappedTransactions.forEach(t => {
      if (t.valid) t.include = checked;
    });
    renderCsvPreviewRows();
    updateCsvImportCount();
  });

  csvStep1.classList.add('hidden');
  csvStep2.classList.remove('hidden');
}

function renderCsvPreviewRows() {
  const display = csvMappedTransactions.slice(0, 150);

  csvPreviewBody.innerHTML = display.map((t, i) => {
    const color = (CATEGORIES[t.category] || CATEGORIES['Other']).color;

    let statusClass, statusText;
    if (!t.valid) {
      statusClass = 'csv-status-err';
      statusText = '✗ ' + t.errors.join(', ');
    } else if (t.isDuplicate) {
      statusClass = 'csv-status-dupe';
      statusText = '⚠ duplicate';
    } else {
      statusClass = 'csv-status-ok';
      statusText = '✓ OK';
    }

    const rowClasses = [];
    if (t.isDuplicate) rowClasses.push('csv-row-dupe');
    if (!t.include && t.valid) rowClasses.push('csv-row-excluded');

    const checkboxDisabled = !t.valid ? 'disabled' : '';
    const checkboxChecked = t.include ? 'checked' : '';

    return `
      <tr class="${rowClasses.join(' ')}">
        <td class="csv-include-cell"><input type="checkbox" data-row="${i}" ${checkboxChecked} ${checkboxDisabled}></td>
        <td class="cell-date">${t.date}</td>
        <td><span class="cell-cat"><span class="cell-cat-dot" style="background:${color}"></span>${t.category}</span></td>
        <td class="cell-desc">${escapeHtml(t.description)}</td>
        <td class="cell-amt">${t.amount > 0 ? '-' + formatCurrency(t.amount) : '—'}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
      </tr>`;
  }).join('');

  if (csvMappedTransactions.length > 150) {
    csvPreviewBody.innerHTML += `
      <tr><td colspan="6" class="empty-msg">Showing first 150 of ${csvMappedTransactions.length} rows</td></tr>`;
  }

  // Row checkbox handlers
  csvPreviewBody.querySelectorAll('input[type="checkbox"][data-row]').forEach(cb => {
    cb.addEventListener('change', () => {
      const idx = parseInt(cb.dataset.row);
      csvMappedTransactions[idx].include = cb.checked;
      // Toggle visual
      const row = cb.closest('tr');
      row.classList.toggle('csv-row-excluded', !cb.checked);
      updateCsvImportCount();
      // Sync select-all
      const selectAll = document.getElementById('csvSelectAll');
      const allValid = csvMappedTransactions.filter(t => t.valid);
      selectAll.checked = allValid.length > 0 && allValid.every(t => t.include);
    });
  });
}

function updateCsvImportCount() {
  const count = csvMappedTransactions.filter(t => t.valid && t.include).length;
  csvImportCount.textContent = count;
}

async function confirmCsvImport() {
  const toImport = csvMappedTransactions.filter(t => t.valid && t.include);
  if (toImport.length === 0) {
    showToast('No records selected for import');
    return;
  }

  // Generate IDs
  const toInsert = toImport.map((t, i) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + i.toString(36),
    description: t.description,
    amount: parseFloat(t.amount.toFixed(2)),
    category: t.category,
    date: t.date,
  }));

  const skippedDupes = csvMappedTransactions.filter(t => t.isDuplicate && !t.include).length;

  try {
    const res = await fetch('/api/transactions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toInsert),
    });
    if (!res.ok) throw new Error('Bulk import failed');
    const result = await res.json();

    // Reload from server to get consistent state
    transactions = await apiGet();
    populateMonthFilter();
    render();

    closeCsvModal();
    let msg = `IMPORT → ${result.added} records added`;
    if (skippedDupes > 0) msg += `, ${skippedDupes} duplicate${skippedDupes !== 1 ? 's' : ''} skipped`;
    setStatus(msg);
    showToast(`Imported ${result.added} records`);
  } catch (err) {
    showToast('Import failed — check server');
    console.error(err);
  }
}

function closeCsvModal() {
  csvModal.classList.add('hidden');
  csvParsedRows = [];
  csvHeaders = [];
  csvColumnMappings = {};
  csvCategoryMap = {};
  csvMappedTransactions = [];
}

// ========== Boot ==========
init();
