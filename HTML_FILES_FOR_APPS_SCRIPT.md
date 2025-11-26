# 📋 Copy-Paste HTML Files untuk Apps Script

## Cara Upload:

Di Google Apps Script project Anda:

1. **Klik ikon +** (Add a file)
2. **Pilih "HTML"**
3. **Nama file**: (lihat di bawah)
4. **Copy-paste code** dari section yang sesuai
5. **Save** (Ctrl+S)

Ulangi untuk ke-3 file.

---

## FILE 1: index

**Nama file di Apps Script**: `index` (tanpa extension)

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistem Keuangan UMKM</title>
  <?!= include('styles'); ?>
</head>
<body>
  <div class="container">
    <h1>🏢 Sistem Informasi Keuangan UMKM</h1>
    <p>Loading aplikasi...</p>
    <div id="app"></div>
  </div>

  <?!= include('app'); ?>
</body>
</html>
```

---

## FILE 2: styles

**Nama file di Apps Script**: `styles` (tanpa extension)

```html
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f7fa;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
}

.user-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.badge {
  background: rgba(255,255,255,0.2);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  text-transform: uppercase;
}

.navbar {
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 10px;
  padding: 0;
}

.nav-item {
  cursor: pointer;
}

.nav-item a {
  display: block;
  padding: 15px 20px;
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: all 0.3s;
}

.nav-item.active a,
.nav-item a:hover {
  color: #667eea;
  background: #f8f9ff;
}

.main-content {
  padding: 30px 0;
  min-height: calc(100vh - 200px);
}

.page {
  display: none;
}

.page.active {
  display: block;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 40px;
}

.stat-content h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.card-body {
  padding: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-content {
  animation: fadeIn 0.3s;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background: #f8f9fa;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  font-weight: 600;
  color: #666;
  font-size: 13px;
  text-transform: uppercase;
}

.table tbody tr:hover {
  background: #f8f9ff;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #999;
}

.loading-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: white;
}

.loading-overlay.active {
  display: flex;
}

.spinner {
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
}

.col-md-6 {
  flex: 0 0 50%;
  max-width: 50%;
  padding: 0 10px;
}

.mt-4 {
  margin-top: 30px;
}

@media (max-width: 768px) {
  .col-md-6 {
    flex: 0 0 100%;
    max-width: 100%;
    margin-bottom: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .nav-menu {
    flex-direction: column;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
```

---

## FILE 3: app

**Nama file di Apps Script**: `app` (tanpa extension)

```html
<script>
// Global variables
let currentUser = null;
let currentCompany = null;
let currentPage = 'dashboard';

// Initialize app on load
window.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  console.log('🚀 Initializing app...');
  loadUserData();
  setupNavigation();
  setupTabs();
}

function loadUserData() {
  showLoading();
  google.script.run
    .withSuccessHandler(function(result) {
      hideLoading();
      if (result.success) {
        currentUser = result.user;
        displayUserInfo();
        loadDashboardData();
      } else {
        showError('Gagal memuat data user: ' + result.message);
      }
    })
    .withFailureHandler(function(error) {
      hideLoading();
      showError('Error: ' + error.message);
    })
    .getCurrentUser();
}

function displayUserInfo() {
  document.getElementById('userName').textContent = currentUser.displayName || currentUser.email;
  document.getElementById('userRole').textContent = currentUser.role || 'user';
  document.getElementById('companyName').textContent = currentUser.companyName || 'UMKM';

  // Hide admin-only menus for regular users
  if (currentUser.role !== 'admin') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => {
      el.style.display = 'none';
    });
  }
}

function loadDashboardData() {
  // Load dashboard stats
  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        updateDashboardStats(result.data);
      }
    })
    .getDashboardStats();
}

function updateDashboardStats(data) {
  document.getElementById('totalCash').textContent = formatCurrency(data.totalCash || 0);
  document.getElementById('monthlyRevenue').textContent = formatCurrency(data.monthlyRevenue || 0);
  document.getElementById('monthlyExpense').textContent = formatCurrency(data.monthlyExpense || 0);
  document.getElementById('monthlyProfit').textContent = formatCurrency(data.monthlyProfit || 0);
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const page = this.getAttribute('data-page');
      showPage(page);
    });
  });
}

function showPage(pageName) {
  // Update active menu
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === pageName) {
      item.classList.add('active');
    }
  });

  // Update active page
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const pageElement = document.getElementById(pageName + '-page');
  if (pageElement) {
    pageElement.classList.add('active');
    currentPage = pageName;

    // Load page data
    loadPageData(pageName);
  }
}

function loadPageData(pageName) {
  switch(pageName) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'master-data':
      loadMasterData();
      break;
    case 'journal':
      loadJournalData();
      break;
    case 'reports':
      loadReportsData();
      break;
    case 'inventory':
      loadInventoryData();
      break;
    case 'debt-receivable':
      loadDebtReceivableData();
      break;
  }
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      const parent = this.closest('.tabs');

      // Update active tab button
      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Update active tab pane
      const content = parent.nextElementSibling;
      content.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      const targetPane = document.getElementById(tabName + '-tab');
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
}

function loadMasterData() {
  console.log('Loading master data...');
  // Placeholder - will be implemented
}

function loadJournalData() {
  console.log('Loading journal data...');
  // Placeholder - will be implemented
}

function loadReportsData() {
  console.log('Loading reports data...');
  // Placeholder - will be implemented
}

function loadInventoryData() {
  console.log('Loading inventory data...');
  // Placeholder - will be implemented
}

function loadDebtReceivableData() {
  console.log('Loading debt/receivable data...');
  // Placeholder - will be implemented
}

// Utility functions
function formatCurrency(amount) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function showError(message) {
  alert('Error: ' + message);
  console.error(message);
}

function showSuccess(message) {
  alert('Success: ' + message);
  console.log(message);
}

// Placeholder functions for Quick Actions
function showReceiptForm() {
  showPage('journal');
  // Switch to receipt tab
  document.querySelector('[data-tab="receipt"]').click();
}

function showExpenseForm() {
  showPage('journal');
  // Switch to expense tab
  document.querySelector('[data-tab="expense"]').click();
}

function showCapitalForm() {
  showPage('journal');
  // Switch to capital tab
  document.querySelector('[data-tab="capital"]').click();
}

console.log('✅ App script loaded');
</script>
```

---

## ✅ Setelah Upload Ke-3 File:

1. **Refresh Apps Script page**
2. **Deploy ulang** (Deploy > Manage deployments > Edit > Deploy)
3. **Akses Web App URL** lagi
4. **Aplikasi seharusnya loading!** 🎉

**Screenshot hasil deploy dan akses aplikasinya ya!** 📸
