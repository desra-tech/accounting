/**
 * Sistem Informasi Keuangan UMKM
 * Main Entry Point untuk Google Apps Script Web App
 *
 * Developed with Google Apps Script + Firestore
 */

/**
 * Fungsi utama untuk menampilkan web app
 */
function doGet(e) {
  const user = Session.getActiveUser().getEmail();

  if (!user) {
    return HtmlService.createHtmlOutputFromFile('src/frontend/login')
      .setTitle('Login - Sistem Keuangan UMKM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('src/frontend/index')
    .setTitle('Sistem Keuangan UMKM')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include HTML files (untuk CSS dan JS)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get current user info
 */
function getUserInfo() {
  const user = getCurrentUser();
  const company = getCompanyInfo();

  return {
    user: user,
    company: company
  };
}

// ==================== API ENDPOINTS ====================

/**
 * Master Data API
 */
const MasterDataAPI = {
  // Accounts
  getAccounts: function(filters) {
    return getAccounts(filters);
  },
  getAccountById: function(accountId) {
    return getAccountById(accountId);
  },
  createAccount: function(data) {
    return createAccount(data);
  },
  updateAccount: function(id, data) {
    return updateAccount(id, data);
  },

  // Customers
  getCustomers: function(filters) {
    return getCustomers(filters);
  },
  createCustomer: function(data) {
    return createCustomer(data);
  },
  updateCustomer: function(id, data) {
    return updateCustomer(id, data);
  },

  // Suppliers
  getSuppliers: function() {
    return getSuppliers();
  },
  createSupplier: function(data) {
    return createSupplier(data);
  },
  updateSupplier: function(id, data) {
    return updateSupplier(id, data);
  },

  // Products
  getProducts: function(filters) {
    return getProducts(filters);
  },
  createProduct: function(data) {
    return createProduct(data);
  },
  updateProduct: function(id, data) {
    return updateProduct(id, data);
  }
};

/**
 * Journal API
 */
const JournalAPI = {
  getJournals: function(filters) {
    return getJournals(filters);
  },
  getJournalById: function(journalId) {
    return getJournalById(journalId);
  },
  createJournal: function(data) {
    return createJournal(data);
  },
  updateJournal: function(id, data) {
    return updateJournal(id, data);
  },
  postJournal: function(id) {
    return postJournal(id);
  },
  voidJournal: function(id) {
    return voidJournal(id);
  },

  // Quick transactions
  createReceiptTransaction: function(data) {
    return createReceiptTransaction(data);
  },
  createExpenseTransaction: function(data) {
    return createExpenseTransaction(data);
  },
  createCapitalInvestment: function(data) {
    return createCapitalInvestment(data);
  },
  createCapitalWithdrawal: function(data) {
    return createCapitalWithdrawal(data);
  }
};

/**
 * Reports API
 */
const ReportsAPI = {
  generateIncomeStatement: function(startDate, endDate) {
    return generateIncomeStatement(startDate, endDate);
  },
  generateBalanceSheet: function(asOfDate) {
    return generateBalanceSheet(asOfDate);
  },
  generateCashFlowStatement: function(startDate, endDate) {
    return generateCashFlowStatement(startDate, endDate);
  },
  getTrialBalance: function() {
    return getTrialBalance();
  },
  getGeneralLedger: function(accountId, startDate, endDate) {
    return getGeneralLedger(accountId, startDate, endDate);
  }
};

/**
 * Inventory API
 */
const InventoryAPI = {
  createStockIn: function(data) {
    return createStockIn(data);
  },
  createStockOut: function(data) {
    return createStockOut(data);
  },
  createStockAdjustment: function(data) {
    return createStockAdjustment(data);
  },
  getStockCard: function(productId, startDate, endDate) {
    return getStockCard(productId, startDate, endDate);
  },
  getStockReport: function() {
    return getStockReport();
  },
  getLowStockProducts: function() {
    return getLowStockProducts();
  }
};

/**
 * Debt & Receivable API
 */
const DebtReceivableAPI = {
  // Receivables
  getReceivables: function(filters) {
    return getReceivables(filters);
  },
  createReceivable: function(data) {
    return createReceivable(data);
  },
  createReceivablePayment: function(data) {
    return createReceivablePayment(data);
  },
  getReceivableAging: function() {
    return getReceivableAging();
  },

  // Payables
  getPayables: function(filters) {
    return getPayables(filters);
  },
  createPayable: function(data) {
    return createPayable(data);
  },
  createPayablePayment: function(data) {
    return createPayablePayment(data);
  }
};

/**
 * Auth API
 */
const AuthAPI = {
  getCurrentUser: function() {
    return getCurrentUser();
  },
  getUserInfo: function() {
    return getUserInfo();
  },
  createUser: function(data) {
    return createUser(data);
  },
  createCompany: function(data) {
    return createCompany(data);
  },
  getCompanyUsers: function() {
    return getCompanyUsers();
  },
  updateUserRole: function(userId, role) {
    return updateUserRole(userId, role);
  },
  canAccessFeature: function(feature) {
    return canAccessFeature(feature);
  }
};

/**
 * Test functions
 */
function testConnection() {
  return testFirestoreConnection();
}

function testGetAccounts() {
  return getAccounts();
}

function testCreateUser() {
  return createUser({
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin'
  });
}

function testCreateCompany() {
  return createCompany({
    name: 'UMKM Contoh',
    address: 'Jl. Contoh No. 123',
    phone: '08123456789',
    email: 'info@umkmcontoh.com',
    taxId: '01.234.567.8-901.000',
    industry: 'Retail'
  });
}
