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
const totalSpentEl = document.getElementById('totalSpent');
const totalCountEl = document.getElementById('totalCount');
const avgSpentEl = document.getElementById('avgSpent');
const maxSpentEl = document.getElementById('maxSpent');
const catCountEl = document.getElementById('catCount');
const categoryTableEl = document.getElementById('categoryTable');
const transactionBodyEl = document.getElementById('transactionBody');
const categoryFilterEl = document.getElementById('categoryFilter');
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

// ========== CSV State ==========
let csvParsedRows = [];
let csvHeaders = [];
let csvColumnMappings = {};   // colIndex -> field name
let csvCategoryMap = {};       // original value -> SpendWise category
let csvMappedTransactions = [];
let editingTransactionId = null;
let sortColumn = 'date';
let sortDirection = 'desc';

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

// ========== Init ==========
async function init() {
  dateInput.value = today();

  try {
    transactions = await apiGet();
    setStatus(`Loaded ${transactions.length} record${transactions.length !== 1 ? 's' : ''} from disk`);
  } catch (err) {
    setStatus('ERROR: Could not reach server');
    console.error(err);
  }

  populateMonthFilter();
  render();
  updateSortIndicators();

  form.addEventListener('submit', handleAddTransaction);
  categoryFilterEl.addEventListener('change', () => {
    syncCategoryHighlights();
    renderTransactionTable();
    updateStats();
  });
  monthFilterEl.addEventListener('change', render);

  // Amount stepper buttons
  amtMinusBtn.addEventListener('click', () => stepAmount(-1));
  amtPlusBtn.addEventListener('click', () => stepAmount(1));

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

// ========== Add Transaction ==========
async function handleAddTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    description: descInput.value.trim(),
    amount: parseFloat(parseFloat(amountInput.value).toFixed(2)),
    category: categoryInput.value,
    date: dateInput.value,
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
    const filtered = getFullyFiltered();
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    document.querySelector('.pie-center-label').textContent = val.toUpperCase().slice(0, 12);
    pieCenterValueEl.textContent = formatCurrency(total);
  } else {
    const filtered = getFilteredByMonth();
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    document.querySelector('.pie-center-label').textContent = 'TOTAL';
    pieCenterValueEl.textContent = formatCurrency(total);
  }
}

// ========== Stats ==========
function updateStats() {
  const filtered = getFullyFiltered();
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  const count = filtered.length;
  const avg = count > 0 ? total / count : 0;
  const max = count > 0 ? Math.max(...filtered.map(t => t.amount)) : 0;

  totalSpentEl.textContent = formatCurrency(total);
  totalCountEl.textContent = count;
  avgSpentEl.textContent = formatCurrency(avg);
  maxSpentEl.textContent = formatCurrency(max);
}

// ========== Render ==========
function render() {
  const monthFiltered = getFilteredByMonth();
  renderCategoryBreakdown(monthFiltered);
  renderPieChart(monthFiltered);
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
  const filtered = getFullyFiltered();

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
    return `
      <tr>
        <td class="cell-id">${t.id.slice(0, 8)}</td>
        <td class="cell-date">${t.date}</td>
        <td><span class="cell-cat"><span class="cell-cat-dot" style="background:${color}"></span>${t.category}</span></td>
        <td class="cell-desc">${escapeHtml(t.description)}</td>
        <td class="cell-amt">-${formatCurrency(t.amount)}</td>
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

let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
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

  const results = [];
  csvParsedRows.forEach(row => {
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

    results.push({
      description: rawDesc || '(empty)',
      amount: isNaN(amount) ? 0 : Math.abs(amount),
      category,
      date: date || today(),
      errors,
      valid: errors.length === 0,
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
  const warnCount = csvMappedTransactions.filter(t => !t.valid).length;

  csvPreviewMeta.textContent = `${validCount} valid · ${warnCount} with issues · ${csvMappedTransactions.length} total`;
  csvImportCount.textContent = validCount;

  csvPreviewBody.innerHTML = csvMappedTransactions.slice(0, 100).map(t => {
    const statusClass = t.valid ? 'csv-status-ok' : 'csv-status-warn';
    const statusText = t.valid ? '✓ OK' : '⚠ ' + t.errors.join(', ');
    const color = (CATEGORIES[t.category] || CATEGORIES['Other']).color;
    return `
      <tr>
        <td class="cell-date">${t.date}</td>
        <td><span class="cell-cat"><span class="cell-cat-dot" style="background:${color}"></span>${t.category}</span></td>
        <td class="cell-desc">${escapeHtml(t.description)}</td>
        <td class="cell-amt">${t.amount > 0 ? '-' + formatCurrency(t.amount) : '—'}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
      </tr>`;
  }).join('');

  if (csvMappedTransactions.length > 100) {
    csvPreviewBody.innerHTML += `
      <tr><td colspan="5" class="empty-msg">Showing first 100 of ${csvMappedTransactions.length} rows</td></tr>`;
  }

  csvStep1.classList.add('hidden');
  csvStep2.classList.remove('hidden');
}

async function confirmCsvImport() {
  const valid = csvMappedTransactions.filter(t => t.valid);
  if (valid.length === 0) {
    showToast('No valid records to import');
    return;
  }

  // Generate IDs
  const toInsert = valid.map((t, i) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + i.toString(36),
    description: t.description,
    amount: parseFloat(t.amount.toFixed(2)),
    category: t.category,
    date: t.date,
  }));

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
    setStatus(`IMPORT → ${result.added} records added, ${result.skipped} skipped`);
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
