/**
 * Konfigurasi Firebase untuk koneksi ke Firestore
 *
 * CARA SETUP:
 * 1. Buat project di Firebase Console (https://console.firebase.google.com)
 * 2. Aktifkan Firestore Database
 * 3. Download Service Account Key (Project Settings > Service Accounts > Generate New Private Key)
 * 4. Simpan credentials di Script Properties dengan cara:
 *    - Buka Apps Script Editor
 *    - File > Project Properties > Script Properties
 *    - Tambahkan property berikut:
 *      Key: FIREBASE_EMAIL, Value: [your-service-account-email]
 *      Key: FIREBASE_KEY, Value: [your-private-key]
 *      Key: FIREBASE_PROJECT_ID, Value: [your-project-id]
 */

/**
 * Mendapatkan konfigurasi Firebase dari Script Properties
 */
function getFirebaseConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();

  return {
    email: scriptProperties.getProperty('FIREBASE_EMAIL'),
    key: scriptProperties.getProperty('FIREBASE_KEY'),
    projectId: scriptProperties.getProperty('FIREBASE_PROJECT_ID')
  };
}

/**
 * Membuat instance Firestore
 */
function getFirestore() {
  const config = getFirebaseConfig();

  if (!config.email || !config.key || !config.projectId) {
    throw new Error('Firebase configuration is missing. Please set up Script Properties.');
  }

  return FirestoreApp.getFirestore(config.email, config.key, config.projectId);
}

/**
 * Test koneksi ke Firestore
 */
function testFirestoreConnection() {
  try {
    const firestore = getFirestore();
    Logger.log('✓ Koneksi ke Firestore berhasil!');
    Logger.log('Project ID: ' + getFirebaseConfig().projectId);
    return { success: true, message: 'Koneksi berhasil' };
  } catch (error) {
    Logger.log('✗ Koneksi gagal: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Initialize Chart of Accounts untuk perusahaan baru
 */
function initializeChartOfAccounts(companyId) {
  const firestore = getFirestore();
  const coaData = getDefaultCOA();

  const batch = [];
  coaData.chartOfAccounts.forEach(account => {
    const accountData = {
      companyId: companyId,
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category,
      normalBalance: account.normalBalance,
      level: account.level,
      parentId: account.parentId || '',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('accounts/' + account.id + '_' + companyId, accountData);
  });

  Logger.log('Chart of Accounts initialized for company: ' + companyId);
  return { success: true, message: 'COA berhasil diinisialisasi' };
}

/**
 * Mendapatkan default COA dari file JSON
 */
function getDefaultCOA() {
  // Data COA standar UMKM
  // Dalam praktiknya, ini bisa dibaca dari file atau database
  return {
    "chartOfAccounts": [
      { "id": "1000", "code": "1-0000", "name": "ASET", "type": "header", "category": "asset", "normalBalance": "debit", "level": 1 },
      { "id": "1100", "code": "1-1000", "name": "ASET LANCAR", "type": "header", "category": "asset", "normalBalance": "debit", "level": 2, "parentId": "1000" },
      { "id": "1101", "code": "1-1001", "name": "Kas", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1100" },
      { "id": "1102", "code": "1-1002", "name": "Bank", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1100" },
      { "id": "1103", "code": "1-1003", "name": "Piutang Usaha", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1100" },
      { "id": "1104", "code": "1-1004", "name": "Persediaan Barang Dagangan", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1100" },
      { "id": "1105", "code": "1-1005", "name": "Uang Muka Pembelian", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1100" },
      { "id": "1200", "code": "1-2000", "name": "ASET TETAP", "type": "header", "category": "asset", "normalBalance": "debit", "level": 2, "parentId": "1000" },
      { "id": "1201", "code": "1-2001", "name": "Peralatan Usaha", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1200" },
      { "id": "1202", "code": "1-2002", "name": "Kendaraan", "type": "detail", "category": "asset", "normalBalance": "debit", "level": 3, "parentId": "1200" },
      { "id": "1203", "code": "1-2003", "name": "Akumulasi Penyusutan", "type": "detail", "category": "asset", "normalBalance": "credit", "level": 3, "parentId": "1200" },
      { "id": "2000", "code": "2-0000", "name": "KEWAJIBAN", "type": "header", "category": "liability", "normalBalance": "credit", "level": 1 },
      { "id": "2100", "code": "2-1000", "name": "KEWAJIBAN LANCAR", "type": "header", "category": "liability", "normalBalance": "credit", "level": 2, "parentId": "2000" },
      { "id": "2101", "code": "2-1001", "name": "Utang Usaha", "type": "detail", "category": "liability", "normalBalance": "credit", "level": 3, "parentId": "2100" },
      { "id": "2102", "code": "2-1002", "name": "Utang Bank Jangka Pendek", "type": "detail", "category": "liability", "normalBalance": "credit", "level": 3, "parentId": "2100" },
      { "id": "2103", "code": "2-1003", "name": "Utang Gaji", "type": "detail", "category": "liability", "normalBalance": "credit", "level": 3, "parentId": "2100" },
      { "id": "2200", "code": "2-2000", "name": "KEWAJIBAN JANGKA PANJANG", "type": "header", "category": "liability", "normalBalance": "credit", "level": 2, "parentId": "2000" },
      { "id": "2201", "code": "2-2001", "name": "Utang Bank Jangka Panjang", "type": "detail", "category": "liability", "normalBalance": "credit", "level": 3, "parentId": "2200" },
      { "id": "3000", "code": "3-0000", "name": "EKUITAS", "type": "header", "category": "equity", "normalBalance": "credit", "level": 1 },
      { "id": "3101", "code": "3-0001", "name": "Modal Pemilik", "type": "detail", "category": "equity", "normalBalance": "credit", "level": 2, "parentId": "3000" },
      { "id": "3102", "code": "3-0002", "name": "Prive/Penarikan Modal", "type": "detail", "category": "equity", "normalBalance": "debit", "level": 2, "parentId": "3000" },
      { "id": "3103", "code": "3-0003", "name": "Laba Ditahan", "type": "detail", "category": "equity", "normalBalance": "credit", "level": 2, "parentId": "3000" },
      { "id": "3104", "code": "3-0004", "name": "Laba Tahun Berjalan", "type": "detail", "category": "equity", "normalBalance": "credit", "level": 2, "parentId": "3000" },
      { "id": "4000", "code": "4-0000", "name": "PENDAPATAN", "type": "header", "category": "revenue", "normalBalance": "credit", "level": 1 },
      { "id": "4101", "code": "4-0001", "name": "Pendapatan Penjualan", "type": "detail", "category": "revenue", "normalBalance": "credit", "level": 2, "parentId": "4000" },
      { "id": "4102", "code": "4-0002", "name": "Pendapatan Jasa", "type": "detail", "category": "revenue", "normalBalance": "credit", "level": 2, "parentId": "4000" },
      { "id": "4103", "code": "4-0003", "name": "Pendapatan Lain-lain", "type": "detail", "category": "revenue", "normalBalance": "credit", "level": 2, "parentId": "4000" },
      { "id": "4201", "code": "4-1001", "name": "Retur Penjualan", "type": "detail", "category": "revenue", "normalBalance": "debit", "level": 2, "parentId": "4000" },
      { "id": "4202", "code": "4-1002", "name": "Potongan Penjualan", "type": "detail", "category": "revenue", "normalBalance": "debit", "level": 2, "parentId": "4000" },
      { "id": "5000", "code": "5-0000", "name": "BEBAN POKOK PENJUALAN", "type": "header", "category": "cogs", "normalBalance": "debit", "level": 1 },
      { "id": "5101", "code": "5-0001", "name": "Pembelian Barang Dagangan", "type": "detail", "category": "cogs", "normalBalance": "debit", "level": 2, "parentId": "5000" },
      { "id": "5102", "code": "5-0002", "name": "Beban Angkut Pembelian", "type": "detail", "category": "cogs", "normalBalance": "debit", "level": 2, "parentId": "5000" },
      { "id": "5103", "code": "5-0003", "name": "Retur Pembelian", "type": "detail", "category": "cogs", "normalBalance": "credit", "level": 2, "parentId": "5000" },
      { "id": "6000", "code": "6-0000", "name": "BEBAN OPERASIONAL", "type": "header", "category": "expense", "normalBalance": "debit", "level": 1 },
      { "id": "6100", "code": "6-1000", "name": "BEBAN PENJUALAN", "type": "header", "category": "expense", "normalBalance": "debit", "level": 2, "parentId": "6000" },
      { "id": "6101", "code": "6-1001", "name": "Beban Gaji Karyawan", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6102", "code": "6-1002", "name": "Beban Sewa Tempat", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6103", "code": "6-1003", "name": "Beban Listrik & Air", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6104", "code": "6-1004", "name": "Beban Telepon & Internet", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6105", "code": "6-1005", "name": "Beban Pemasaran", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6106", "code": "6-1006", "name": "Beban Transportasi", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6107", "code": "6-1007", "name": "Beban Perlengkapan", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6108", "code": "6-1008", "name": "Beban Pemeliharaan", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6109", "code": "6-1009", "name": "Beban Penyusutan", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6100" },
      { "id": "6200", "code": "6-2000", "name": "BEBAN ADMINISTRASI & UMUM", "type": "header", "category": "expense", "normalBalance": "debit", "level": 2, "parentId": "6000" },
      { "id": "6201", "code": "6-2001", "name": "Beban Alat Tulis Kantor", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6200" },
      { "id": "6202", "code": "6-2002", "name": "Beban Perizinan", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6200" },
      { "id": "6203", "code": "6-2003", "name": "Beban Lain-lain", "type": "detail", "category": "expense", "normalBalance": "debit", "level": 3, "parentId": "6200" },
      { "id": "7000", "code": "7-0000", "name": "PENDAPATAN & BEBAN LAIN", "type": "header", "category": "other", "normalBalance": "credit", "level": 1 },
      { "id": "7101", "code": "7-0001", "name": "Pendapatan Bunga", "type": "detail", "category": "other", "normalBalance": "credit", "level": 2, "parentId": "7000" },
      { "id": "7201", "code": "7-1001", "name": "Beban Bunga", "type": "detail", "category": "other", "normalBalance": "debit", "level": 2, "parentId": "7000" }
    ]
  };
}
