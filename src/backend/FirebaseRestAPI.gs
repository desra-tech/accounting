/**
 * Firebase REST API Alternative
 * Menggunakan HTTP request langsung tanpa FirestoreApp library
 * Solusi untuk bypass error "Invalid argument: key"
 */

/**
 * Get OAuth2 Access Token untuk Firebase REST API
 */
function getFirebaseAccessToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const email = scriptProperties.getProperty('FIREBASE_EMAIL');
  const key = scriptProperties.getProperty('FIREBASE_KEY');

  if (!email || !key) {
    throw new Error('Firebase credentials tidak ditemukan di Script Properties');
  }

  // Create JWT untuk authentication
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now
  };

  const jwt = createJWT(header, claim, key);

  // Exchange JWT for access token
  const options = {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', options);
  const result = JSON.parse(response.getContentText());

  if (result.access_token) {
    return result.access_token;
  } else {
    Logger.log('Error getting access token: ' + response.getContentText());
    throw new Error('Gagal mendapatkan access token');
  }
}

/**
 * Create JWT (JSON Web Token) manually
 */
function createJWT(header, claim, key) {
  const headerStr = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const claimStr = Utilities.base64EncodeWebSafe(JSON.stringify(claim));
  const signatureInput = headerStr + '.' + claimStr;

  // Sign with RSA-SHA256
  const signature = Utilities.computeRsaSha256Signature(signatureInput, key);
  const signatureStr = Utilities.base64EncodeWebSafe(signature);

  return signatureInput + '.' + signatureStr;
}

/**
 * Get document menggunakan REST API
 */
function getDocumentViaREST(collectionPath, documentId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const projectId = scriptProperties.getProperty('FIREBASE_PROJECT_ID');

  const accessToken = getFirebaseAccessToken();

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${documentId}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode === 200) {
    const data = JSON.parse(response.getContentText());
    return parseFirestoreDocument(data);
  } else {
    Logger.log('Error: ' + response.getContentText());
    return null;
  }
}

/**
 * Create/Update document menggunakan REST API
 */
function setDocumentViaREST(collectionPath, documentId, data) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const projectId = scriptProperties.getProperty('FIREBASE_PROJECT_ID');

  const accessToken = getFirebaseAccessToken();

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${documentId}`;

  const firestoreData = convertToFirestoreFormat(data);

  const options = {
    method: 'patch',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({ fields: firestoreData }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode === 200) {
    return JSON.parse(response.getContentText());
  } else {
    Logger.log('Error: ' + response.getContentText());
    throw new Error('Gagal membuat/update document: ' + response.getContentText());
  }
}

/**
 * Convert JavaScript object ke Firestore format
 */
function convertToFirestoreFormat(obj) {
  const result = {};

  for (const key in obj) {
    const value = obj[key];

    if (value === null || value === undefined) {
      result[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        result[key] = { integerValue: value.toString() };
      } else {
        result[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      result[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      result[key] = {
        arrayValue: {
          values: value.map(v => convertToFirestoreFormat({ val: v }).val)
        }
      };
    } else if (typeof value === 'object') {
      result[key] = {
        mapValue: {
          fields: convertToFirestoreFormat(value)
        }
      };
    }
  }

  return result;
}

/**
 * Parse Firestore document ke JavaScript object
 */
function parseFirestoreDocument(doc) {
  if (!doc || !doc.fields) return null;

  const result = {};

  for (const key in doc.fields) {
    const field = doc.fields[key];

    if (field.stringValue !== undefined) {
      result[key] = field.stringValue;
    } else if (field.integerValue !== undefined) {
      result[key] = parseInt(field.integerValue);
    } else if (field.doubleValue !== undefined) {
      result[key] = field.doubleValue;
    } else if (field.booleanValue !== undefined) {
      result[key] = field.booleanValue;
    } else if (field.timestampValue !== undefined) {
      result[key] = new Date(field.timestampValue);
    } else if (field.nullValue !== undefined) {
      result[key] = null;
    } else if (field.arrayValue !== undefined) {
      result[key] = field.arrayValue.values ?
        field.arrayValue.values.map(v => parseFirestoreDocument({ fields: { val: v } }).val) :
        [];
    } else if (field.mapValue !== undefined) {
      result[key] = parseFirestoreDocument({ fields: field.mapValue.fields });
    }
  }

  return result;
}

/**
 * TEST: Get user menggunakan REST API
 */
function testGetUserViaREST() {
  const userId = 'BuaSSMfBf0bP6tTK5o91'; // GANTI dengan Document ID Anda

  try {
    Logger.log('🔍 Mengambil user via REST API...');
    Logger.log('   User ID: ' + userId);

    const user = getDocumentViaREST('users', userId);

    if (user) {
      Logger.log('✅ User found!');
      Logger.log('   Email: ' + user.email);
      Logger.log('   Display Name: ' + user.displayName);
      Logger.log('   Role: ' + user.role);
      Logger.log('   Company ID: ' + (user.companyId || '(belum ada)'));
      Logger.log('   Active: ' + user.isActive);
      return { success: true, user: user };
    } else {
      Logger.log('❌ User not found');
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    Logger.log('   Stack: ' + error.stack);
    return { success: false, message: error.message };
  }
}

/**
 * TEST: Create company menggunakan REST API
 */
function testCreateCompanyViaREST() {
  const userId = 'BuaSSMfBf0bP6tTK5o91'; // GANTI dengan Document ID Anda

  try {
    Logger.log('🏢 Membuat company via REST API...');

    // Generate company ID
    const companyId = Utilities.getUuid();
    Logger.log('   Company ID: ' + companyId);

    // Data company
    const companyData = {
      id: companyId,
      name: 'UMKM Contoh',
      address: 'Jl. Contoh No. 123',
      phone: '08123456789',
      email: 'info@umkmcontoh.com',
      taxId: '01.234.567.8-901.000',
      industry: 'Retail',
      foundedDate: new Date().toISOString(),
      ownerId: userId,
      currency: 'IDR',
      fiscalYearStart: '01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create company document
    Logger.log('📝 Creating company document...');
    setDocumentViaREST('companies', companyId, companyData);
    Logger.log('✅ Company created!');

    // Update user dengan companyId
    Logger.log('🔄 Updating user...');
    const userData = {
      companyId: companyId,
      updatedAt: new Date().toISOString()
    };
    setDocumentViaREST('users', userId, userData);
    Logger.log('✅ User updated!');

    Logger.log('');
    Logger.log('🎉 ===== COMPANY SETUP BERHASIL! =====');
    Logger.log('   Company ID: ' + companyId);
    Logger.log('   User ID: ' + userId);
    Logger.log('');
    Logger.log('📝 Next: Run testInitializeCOAViaREST() untuk setup Chart of Accounts');

    return { success: true, companyId: companyId };

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    Logger.log('   Stack: ' + error.stack);
    return { success: false, message: error.message };
  }
}

/**
 * TEST: Initialize Chart of Accounts via REST API
 */
function testInitializeCOAViaREST() {
  const userId = 'BuaSSMfBf0bP6tTK5o91'; // GANTI dengan Document ID Anda

  try {
    Logger.log('📊 Initialize Chart of Accounts via REST API...');

    // Get user untuk ambil companyId
    const user = getDocumentViaREST('users', userId);
    if (!user || !user.companyId) {
      throw new Error('User tidak punya companyId. Run testCreateCompanyViaREST() dulu!');
    }

    const companyId = user.companyId;
    Logger.log('   Company ID: ' + companyId);

    // Load COA dari JSON
    const coaJson = loadCOAFromJSON();
    Logger.log('   Total accounts: ' + coaJson.length);

    let successCount = 0;
    let errorCount = 0;

    // Create each account
    for (let i = 0; i < coaJson.length; i++) {
      const account = coaJson[i];
      const accountId = Utilities.getUuid();

      const accountData = {
        id: accountId,
        code: account.code,
        name: account.name,
        category: account.category,
        type: account.type,
        normalBalance: account.normalBalance,
        isActive: true,
        companyId: companyId,
        balance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        setDocumentViaREST('accounts', accountId, accountData);
        successCount++;

        if ((i + 1) % 10 === 0) {
          Logger.log('   Progress: ' + (i + 1) + '/' + coaJson.length + ' accounts created');
        }
      } catch (error) {
        Logger.log('   ⚠️  Failed to create account: ' + account.code + ' - ' + error.message);
        errorCount++;
      }
    }

    Logger.log('');
    Logger.log('✅ COA Initialization Complete!');
    Logger.log('   Success: ' + successCount + ' accounts');
    Logger.log('   Errors: ' + errorCount);
    Logger.log('');
    Logger.log('📝 Next: Run testInitializeSettingsViaREST() untuk setup Settings');

    return { success: true, created: successCount, errors: errorCount };

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * TEST: Initialize Settings via REST API
 */
function testInitializeSettingsViaREST() {
  const userId = 'BuaSSMfBf0bP6tTK5o91'; // GANTI dengan Document ID Anda

  try {
    Logger.log('⚙️  Initialize Settings via REST API...');

    // Get user untuk ambil companyId
    const user = getDocumentViaREST('users', userId);
    if (!user || !user.companyId) {
      throw new Error('User tidak punya companyId!');
    }

    const companyId = user.companyId;
    const settingsId = Utilities.getUuid();

    const settingsData = {
      id: settingsId,
      companyId: companyId,
      currency: 'IDR',
      currencySymbol: 'Rp',
      decimalPlaces: 2,
      dateFormat: 'DD/MM/YYYY',
      fiscalYearStart: '01-01',
      taxRate: 11,
      lowStockThreshold: 10,
      paymentTermDays: 30,
      reportSettings: {
        showZeroBalance: false,
        groupByCategory: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDocumentViaREST('settings', settingsId, settingsData);

    Logger.log('✅ Settings initialized!');
    Logger.log('');
    Logger.log('🎉 ===== SEMUA SETUP SELESAI! =====');
    Logger.log('   Company ID: ' + companyId);
    Logger.log('   User ID: ' + userId);
    Logger.log('   Settings ID: ' + settingsId);
    Logger.log('');
    Logger.log('📝 Next: Deploy Web App dan akses aplikasi!');

    return { success: true, settingsId: settingsId };

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Load COA from JSON (sama seperti di MasterData.gs)
 */
function loadCOAFromJSON() {
  return [
    { code: '1-1110', name: 'Kas', category: 'ASET', type: 'Kas & Bank', normalBalance: 'DEBIT' },
    { code: '1-1120', name: 'Bank', category: 'ASET', type: 'Kas & Bank', normalBalance: 'DEBIT' },
    { code: '1-1210', name: 'Piutang Usaha', category: 'ASET', type: 'Piutang', normalBalance: 'DEBIT' },
    { code: '1-1220', name: 'Piutang Lain-lain', category: 'ASET', type: 'Piutang', normalBalance: 'DEBIT' },
    { code: '1-1230', name: 'Cadangan Kerugian Piutang', category: 'ASET', type: 'Piutang', normalBalance: 'KREDIT' },
    { code: '1-1310', name: 'Persediaan Barang Dagang', category: 'ASET', type: 'Persediaan', normalBalance: 'DEBIT' },
    { code: '1-1320', name: 'Persediaan Bahan Baku', category: 'ASET', type: 'Persediaan', normalBalance: 'DEBIT' },
    { code: '1-1410', name: 'Uang Muka Pembelian', category: 'ASET', type: 'Aset Lancar Lainnya', normalBalance: 'DEBIT' },
    { code: '1-1420', name: 'Biaya Dibayar Dimuka', category: 'ASET', type: 'Aset Lancar Lainnya', normalBalance: 'DEBIT' },
    { code: '1-2110', name: 'Tanah', category: 'ASET', type: 'Aset Tetap', normalBalance: 'DEBIT' },
    { code: '1-2120', name: 'Bangunan', category: 'ASET', type: 'Aset Tetap', normalBalance: 'DEBIT' },
    { code: '1-2121', name: 'Akumulasi Penyusutan Bangunan', category: 'ASET', type: 'Aset Tetap', normalBalance: 'KREDIT' },
    { code: '1-2130', name: 'Kendaraan', category: 'ASET', type: 'Aset Tetap', normalBalance: 'DEBIT' },
    { code: '1-2131', name: 'Akumulasi Penyusutan Kendaraan', category: 'ASET', type: 'Aset Tetap', normalBalance: 'KREDIT' },
    { code: '1-2140', name: 'Peralatan', category: 'ASET', type: 'Aset Tetap', normalBalance: 'DEBIT' },
    { code: '1-2141', name: 'Akumulasi Penyusutan Peralatan', category: 'ASET', type: 'Aset Tetap', normalBalance: 'KREDIT' },
    { code: '1-2150', name: 'Inventaris Kantor', category: 'ASET', type: 'Aset Tetap', normalBalance: 'DEBIT' },
    { code: '1-2151', name: 'Akumulasi Penyusutan Inventaris', category: 'ASET', type: 'Aset Tetap', normalBalance: 'KREDIT' },
    { code: '2-1110', name: 'Utang Usaha', category: 'KEWAJIBAN', type: 'Utang Lancar', normalBalance: 'KREDIT' },
    { code: '2-1120', name: 'Utang Gaji', category: 'KEWAJIBAN', type: 'Utang Lancar', normalBalance: 'KREDIT' },
    { code: '2-1130', name: 'Utang Pajak', category: 'KEWAJIBAN', type: 'Utang Lancar', normalBalance: 'KREDIT' },
    { code: '2-1140', name: 'Biaya yang Masih Harus Dibayar', category: 'KEWAJIBAN', type: 'Utang Lancar', normalBalance: 'KREDIT' },
    { code: '2-1150', name: 'Uang Muka Penjualan', category: 'KEWAJIBAN', type: 'Utang Lancar', normalBalance: 'KREDIT' },
    { code: '2-2110', name: 'Utang Bank Jangka Panjang', category: 'KEWAJIBAN', type: 'Utang Jangka Panjang', normalBalance: 'KREDIT' },
    { code: '2-2120', name: 'Utang Lain-lain Jangka Panjang', category: 'KEWAJIBAN', type: 'Utang Jangka Panjang', normalBalance: 'KREDIT' },
    { code: '3-1110', name: 'Modal Pemilik', category: 'EKUITAS', type: 'Modal', normalBalance: 'KREDIT' },
    { code: '3-1120', name: 'Modal Tambahan', category: 'EKUITAS', type: 'Modal', normalBalance: 'KREDIT' },
    { code: '3-1210', name: 'Prive', category: 'EKUITAS', type: 'Prive', normalBalance: 'DEBIT' },
    { code: '3-1310', name: 'Laba Ditahan', category: 'EKUITAS', type: 'Laba Ditahan', normalBalance: 'KREDIT' },
    { code: '3-1320', name: 'Laba Tahun Berjalan', category: 'EKUITAS', type: 'Laba Ditahan', normalBalance: 'KREDIT' },
    { code: '4-1110', name: 'Penjualan Barang Dagang', category: 'PENDAPATAN', type: 'Pendapatan Usaha', normalBalance: 'KREDIT' },
    { code: '4-1120', name: 'Penjualan Jasa', category: 'PENDAPATAN', type: 'Pendapatan Usaha', normalBalance: 'KREDIT' },
    { code: '4-1130', name: 'Retur Penjualan', category: 'PENDAPATAN', type: 'Pendapatan Usaha', normalBalance: 'DEBIT' },
    { code: '4-1140', name: 'Potongan Penjualan', category: 'PENDAPATAN', type: 'Pendapatan Usaha', normalBalance: 'DEBIT' },
    { code: '5-1110', name: 'Pembelian Barang Dagang', category: 'HPP', type: 'Beban Pokok Penjualan', normalBalance: 'DEBIT' },
    { code: '5-1120', name: 'Retur Pembelian', category: 'HPP', type: 'Beban Pokok Penjualan', normalBalance: 'KREDIT' },
    { code: '5-1130', name: 'Potongan Pembelian', category: 'HPP', type: 'Beban Pokok Penjualan', normalBalance: 'KREDIT' },
    { code: '5-1140', name: 'Beban Angkut Pembelian', category: 'HPP', type: 'Beban Pokok Penjualan', normalBalance: 'DEBIT' },
    { code: '6-1110', name: 'Beban Gaji', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1120', name: 'Beban Listrik', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1130', name: 'Beban Air', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1140', name: 'Beban Telepon & Internet', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1150', name: 'Beban Sewa', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1160', name: 'Beban Perlengkapan', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1170', name: 'Beban Pemeliharaan', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1180', name: 'Beban Transportasi', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1190', name: 'Beban Asuransi', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1210', name: 'Beban Iklan & Promosi', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1220', name: 'Beban Penyusutan', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1230', name: 'Beban Pajak', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1240', name: 'Beban Administrasi Bank', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '6-1250', name: 'Beban Lain-lain', category: 'BEBAN', type: 'Beban Operasional', normalBalance: 'DEBIT' },
    { code: '7-1110', name: 'Pendapatan Bunga', category: 'LAIN-LAIN', type: 'Pendapatan Lain-lain', normalBalance: 'KREDIT' },
    { code: '7-1120', name: 'Pendapatan Lain-lain', category: 'LAIN-LAIN', type: 'Pendapatan Lain-lain', normalBalance: 'KREDIT' },
    { code: '7-2110', name: 'Beban Bunga', category: 'LAIN-LAIN', type: 'Beban Lain-lain', normalBalance: 'DEBIT' },
    { code: '7-2120', name: 'Beban Lain-lain', category: 'LAIN-LAIN', type: 'Beban Lain-lain', normalBalance: 'DEBIT' },
    { code: '7-3110', name: 'Laba/Rugi Penjualan Aset', category: 'LAIN-LAIN', type: 'Laba/Rugi Lain-lain', normalBalance: 'KREDIT' }
  ];
}
