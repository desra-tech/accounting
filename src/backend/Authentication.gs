/**
 * Sistem Autentikasi dan Otorisasi
 * Mengelola user authentication, session, dan role-based access control
 */

/**
 * Mendapatkan user yang sedang login
 */
function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();

  if (!email) {
    return null;
  }

  const firestore = getFirestore();
  const users = firestore.query('users').where('email', '==', email).execute();

  if (users.length > 0) {
    return users[0].fields;
  }

  return null;
}

/**
 * Membuat user baru (untuk setup awal, tanpa query)
 * Gunakan ini untuk membuat user pertama kali
 */
function createUserFirstTime(userData) {
  Logger.log('🚀 Function createUserFirstTime dipanggil');
  Logger.log('   Parameter userData: ' + (userData ? 'ADA' : 'UNDEFINED'));

  if (!userData) {
    Logger.log('❌ ERROR: userData is undefined!');
    return { success: false, message: 'userData parameter is required' };
  }

  if (!userData.email) {
    Logger.log('❌ ERROR: userData.email is undefined!');
    return { success: false, message: 'email is required' };
  }

  Logger.log('   Email dari parameter: ' + userData.email);

  try {
    Logger.log('\n🔗 Mendapatkan Firestore instance...');
    const firestore = getFirestore();
    Logger.log('✅ Firestore instance berhasil didapat');

    const email = userData.email;
    const userId = Utilities.getUuid();

    Logger.log('📝 Membuat data user...');
    Logger.log('   User ID: ' + userId);
    Logger.log('   Email: ' + email);

    // Format timestamp sebagai string ISO untuk kompatibilitas
    const now = new Date().toISOString();

    const newUser = {
      uid: userId,
      email: email,
      displayName: userData.displayName || email.split('@')[0],
      role: userData.role || 'admin',
      companyId: userData.companyId || '',
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    Logger.log('   Display Name: ' + newUser.displayName);
    Logger.log('   Role: ' + newUser.role);
    Logger.log('   Timestamp: ' + now);

    Logger.log('\n🔄 Menulis ke Firestore collection "users"...');
    firestore.createDocument('users/' + userId, newUser);

    Logger.log('✅ User berhasil dibuat!');
    return { success: true, message: 'User berhasil dibuat', userId: userId };
  } catch (error) {
    Logger.log('\n❌ Error creating user: ' + error.message);
    Logger.log('   Error name: ' + error.name);
    if (error.stack) {
      Logger.log('   Stack: ' + error.stack);
    }
    return { success: false, message: error.message };
  }
}

/**
 * Membuat user baru (dengan validasi)
 * Gunakan ini setelah user pertama sudah ada dan index sudah dibuat
 */
function createUser(userData) {
  try {
    const firestore = getFirestore();
    const email = userData.email;

    // Cek apakah user sudah ada (butuh index di Firestore)
    try {
      const existingUsers = firestore.query('users').where('email', '==', email).execute();

      if (existingUsers.length > 0) {
        return { success: false, message: 'Email sudah terdaftar' };
      }
    } catch (queryError) {
      // Jika query gagal (index belum ada), skip validation
      Logger.log('⚠️  Query validation skipped (index mungkin belum ada)');
    }

    const userId = Utilities.getUuid();
    const newUser = {
      uid: userId,
      email: email,
      displayName: userData.displayName || email.split('@')[0],
      role: userData.role || 'user',
      companyId: userData.companyId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    firestore.createDocument('users/' + userId, newUser);

    return { success: true, message: 'User berhasil dibuat', userId: userId };
  } catch (error) {
    Logger.log('Error creating user: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Membuat perusahaan baru
 */
function createCompany(companyData) {
  try {
    const firestore = getFirestore();
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return { success: false, message: 'User tidak terautentikasi' };
    }

    const companyId = Utilities.getUuid();
    const newCompany = {
      id: companyId,
      name: companyData.name,
      address: companyData.address || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      taxId: companyData.taxId || '',
      industry: companyData.industry || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: currentUser.uid
    };

    firestore.createDocument('companies/' + companyId, newCompany);

    // Update user dengan companyId
    firestore.updateDocument('users/' + currentUser.uid, { companyId: companyId, role: 'admin' });

    // Initialize Chart of Accounts
    initializeChartOfAccounts(companyId);

    // Initialize Settings
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
      updatedAt: new Date()
    };
    firestore.createDocument('settings/' + companyId, settings);

    return { success: true, message: 'Perusahaan berhasil dibuat', companyId: companyId };
  } catch (error) {
    Logger.log('Error creating company: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mengecek apakah user memiliki role tertentu
 */
function hasRole(requiredRole) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return false;
  }

  if (requiredRole === 'admin') {
    return currentUser.role === 'admin';
  }

  // User role bisa akses menu tertentu
  if (requiredRole === 'user') {
    return currentUser.role === 'user' || currentUser.role === 'admin';
  }

  return false;
}

/**
 * Mengecek apakah user bisa mengakses fitur tertentu
 */
function canAccessFeature(feature) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Admin bisa akses semua
  if (currentUser.role === 'admin') {
    return true;
  }

  // User hanya bisa akses fitur tertentu
  const userAllowedFeatures = [
    'journal_receipt',
    'journal_expense',
    'reports_all',
    'inventory_view',
    'receivables_view',
    'payables_view'
  ];

  return userAllowedFeatures.includes(feature);
}

/**
 * Mendapatkan company ID user yang sedang login
 */
function getCurrentCompanyId() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return currentUser.companyId;
}

/**
 * Mendapatkan informasi company
 */
function getCompanyInfo() {
  const companyId = getCurrentCompanyId();

  if (!companyId) {
    return null;
  }

  const firestore = getFirestore();
  const company = firestore.getDocument('companies/' + companyId);

  return company.fields;
}

/**
 * Mendapatkan semua users dalam company
 */
function getCompanyUsers() {
  const companyId = getCurrentCompanyId();

  if (!companyId) {
    return [];
  }

  const firestore = getFirestore();
  const users = firestore.query('users').where('companyId', '==', companyId).execute();

  return users.map(user => user.fields);
}

/**
 * Update user role (hanya admin yang bisa)
 */
function updateUserRole(userId, newRole) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa mengubah role' };
  }

  try {
    const firestore = getFirestore();
    firestore.updateDocument('users/' + userId, {
      role: newRole,
      updatedAt: new Date()
    });

    return { success: true, message: 'Role berhasil diubah' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Deactivate user (hanya admin yang bisa)
 */
function deactivateUser(userId) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa menonaktifkan user' };
  }

  try {
    const firestore = getFirestore();
    firestore.updateDocument('users/' + userId, {
      isActive: false,
      updatedAt: new Date()
    });

    return { success: true, message: 'User berhasil dinonaktifkan' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
