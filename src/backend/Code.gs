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

/**
 * GUNAKAN INI untuk membuat user admin pertama kali
 * Ganti email dengan email Google Anda
 */
function testCreateUserFirstTime() {
  Logger.log('Membuat user admin pertama kali...\n');

  // GANTI EMAIL INI dengan email Google Anda!
  const result = createUserFirstTime({
    email: Session.getActiveUser().getEmail(), // Otomatis ambil email yang sedang login
    displayName: 'Admin User',
    role: 'admin'
  });

  if (result.success) {
    Logger.log('\n=== USER BERHASIL DIBUAT ===');
    Logger.log('Lanjutkan dengan testCreateCompany()');
  }

  return result;
}

/**
 * (DEPRECATED) Gunakan testCreateUserFirstTime() untuk setup awal
 * Function ini butuh index di Firestore
 */
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

/**
 * MANUAL SETUP FUNCTIONS - Untuk bypass query error
 */

/**
 * Get user by document ID (bypass query yang error)
 * Lihat document ID di Firestore Console > users collection
 */
function testGetUserByIdManual() {
  // GANTI dengan document ID dari Firestore Console
  const userId = 'PASTE_DOCUMENT_ID_DISINI';  // Contoh: 'adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2'

  try {
    const firestore = getFirestore();
    Logger.log('🔍 Mengambil user dengan ID: ' + userId);

    const userDoc = firestore.getDocument('users/' + userId);

    if (userDoc && userDoc.fields) {
      Logger.log('✅ User found!');
      Logger.log('   Email: ' + userDoc.fields.email);
      Logger.log('   Role: ' + userDoc.fields.role);
      Logger.log('   Company ID: ' + (userDoc.fields.companyId || '(belum ada)'));
      return { success: true, user: userDoc.fields };
    } else {
      Logger.log('❌ User not found');
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Create company MANUAL (bypass getCurrentUser yang error)
 * Ganti userId dengan document ID user dari Firestore Console
 */
function testCreateCompanyManual() {
  // GANTI dengan document ID user dari Firestore Console
  const userId = 'PASTE_DOCUMENT_ID_DISINI';  // Contoh: 'adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2'

  try {
    const firestore = getFirestore();
    Logger.log('🏢 Membuat company...\n');

    const companyId = Utilities.getUuid();
    const now = new Date().toISOString();

    const newCompany = {
      id: companyId,
      name: 'UMKM Contoh',
      address: 'Jl. Contoh No. 123',
      phone: '08123456789',
      email: 'info@umkmcontoh.com',
      taxId: '01.234.567.8-901.000',
      industry: 'Retail',
      createdAt: now,
      updatedAt: now,
      ownerId: userId
    };

    Logger.log('   Company ID: ' + companyId);
    Logger.log('   Name: ' + newCompany.name);

    firestore.createDocument('companies/' + companyId, newCompany);
    Logger.log('✅ Company created!\n');

    // Update user dengan companyId
    Logger.log('🔄 Update user dengan companyId...');
    firestore.updateDocument('users/' + userId, {
      companyId: companyId,
      role: 'admin',
      updatedAt: now
    });
    Logger.log('✅ User updated!\n');

    // Initialize Chart of Accounts
    Logger.log('📊 Initialize Chart of Accounts (57 akun)...');
    initializeChartOfAccounts(companyId);
    Logger.log('✅ COA initialized!\n');

    // Initialize Settings
    Logger.log('⚙️  Initialize Settings...');
    const settings = {
      companyId: companyId,
      fiscalYearStart: '01-01',
      fiscalYearEnd: '12-31',
      currency: 'IDR',
      taxRate: 11,
      receiptPrefix: 'RCP',
      expensePrefix: 'EXP',
      journalPrefix: 'JRN',
      invoicePrefix: 'INV',
      updatedAt: now
    };
    firestore.createDocument('settings/' + companyId, settings);
    Logger.log('✅ Settings initialized!\n');

    Logger.log('🎉 ===== SEMUA SETUP BERHASIL! =====');
    Logger.log('   Company ID: ' + companyId);
    Logger.log('   User ID: ' + userId);
    Logger.log('\n📝 Next: Deploy Web App dan akses aplikasi!');

    return { success: true, message: 'Setup completed', companyId: companyId };
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    if (error.stack) {
      Logger.log('   Stack: ' + error.stack);
    }
    return { success: false, message: error.message };
  }
}
