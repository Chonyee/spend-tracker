# Spending Tracker

Personal project — a client-side spending tracker that runs entirely in the browser. Data stays in browser's localStorage and never leaves unless explicitly exported.

**Live demo:** [chonyee.github.io/spending-tracker](https://chonyee.github.io/spending-tracker)

---

## Features

### Transaction management
- Add, edit, and delete transactions with description, amount, category, date, and type (expense or income)
- Sort by date, category, description, or amount (click column headers)
- Full-text search across all fields with match highlighting
- Filter by month/period and category — filters stack and sync across the sidebar, pie chart, and table

### Categories
Food & Dining, Transportation, Shopping, Clothes, House, Entertainment, Bills & Utilities, Health, Education, Travel, Personal Care, Paycheck / Salary, and Other — each with a distinct color

### Income tracking
Toggle between expense and income on any transaction. The stat bar shows total expenses (red), total income (green), net cash flow, and transaction count. Income appears as green `+$X.XX` in the table.

### Recurring transactions
Set up rules for repeating expenses or income (monthly, biweekly, weekly). Transactions auto-generate on page load for any dates between the last generated date and today. Supports backfill — add a rule with a past start date and it creates all the transactions that would have occurred.

### CSV import
Full column-mapping interface: upload a CSV, assign columns to fields (auto-detected from headers and value patterns), map unrecognized categories with fuzzy matching, preview with validation, and selectively include/exclude rows. Duplicate detection compares date + description + amount against existing data.

### Data portability
- **Export as CSV** — respects active filters (period, category, search), standard format compatible with Excel and other tools
- **Export as JSON backup** — complete snapshot of all transactions and recurring rules
- **Import from JSON backup** — restore on another device or browser, merges by ID to avoid duplicates

### Analytics
- **Category deep dive** — click any category to see total, count, average, min/max range, monthly trend line, top 5 largest, and recent transactions
- **Monthly cash flow** — SVG bar chart showing income vs expenses over the last 12 months with hover tooltips
- **Top expenses** — 10 largest individual transactions ranked with category-colored bars
- **Category trends** — line chart tracking top 5 spending categories over the last 6 months with smooth bezier curves and interactive data points

### Sidebar
- Quick-add transaction form with expense/income toggle and smart amount stepper (increments scale with value)
- Category breakdown with click-to-filter (syncs with table, pie chart, and stats)
- Donut pie chart with clickable slices
- Recurring rules list showing frequency, next due date, and amount

---

## Tech stack

- **Vanilla JS** — no frameworks, no build step, no dependencies
- **localStorage** — all persistence is client-side
- **SVG** — all charts are hand-built SVG, no chart libraries
- **CSS custom properties** — consistent theming throughout
- **Source Code Pro + Share Tech Mono** — typography

Four files total: `index.html`, `styles.css`, `app.js`, `favicon.svg`

---

## Setup

### GitHub Pages (recommended)
1. Fork or clone this repo
2. Go to **Settings → Pages → Source**: deploy from `main` branch, root `/`
3. Your tracker is live at `https://yourusername.github.io/spending-tracker`

### Local
Just open `index.html` in a browser. Everything works offline.

---

## Data storage

All data lives in your browser's `localStorage` under two keys:
- `spendwise_transactions` — array of transaction objects
- `spendwise_recurring` — array of recurring rule objects

Clearing your browser data will delete your transactions. Use **IMPORT / EXPORT → Export as JSON backup** regularly if you want to keep your data safe. The JSON backup contains everything and can be re-imported on any device.

---

## License

This is a personal project. Feel free to fork it and make it your own.
