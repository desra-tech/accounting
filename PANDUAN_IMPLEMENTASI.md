# 📚 Panduan Implementasi Sistem Keuangan UMKM

## Daftar Isi
1. [Persiapan Awal](#persiapan-awal)
2. [Setup Firebase & Firestore](#setup-firebase--firestore)
3. [Setup Google Apps Script](#setup-google-apps-script)
4. [Deploy Web App](#deploy-web-app)
5. [Konfigurasi Security Rules](#konfigurasi-security-rules)
6. [Testing & Troubleshooting](#testing--troubleshooting)
7. [Maintenance & Backup](#maintenance--backup)

---

## 1. Persiapan Awal

### Kebutuhan Sistem
- Akun Google (Gmail)
- Akun Firebase (gratis)
- Browser modern (Chrome, Firefox, Edge)
- Koneksi internet stabil

### Struktur File Proyek
```
accounting/
├── src/
│   ├── backend/          # Google Apps Script files (.gs)
│   │   ├── Code.gs
│   │   ├── FirebaseConfig.gs
│   │   ├── Authentication.gs
│   │   ├── MasterData.gs
│   │   ├── Journal.gs
│   │   ├── Reports.gs
│   │   ├── Inventory.gs
│   │   └── DebtReceivable.gs
│   ├── frontend/         # HTML/CSS/JS files
│   │   ├── index.html
│   │   ├── css/
│   │   │   └── styles.html
│   │   └── js/
│   │       └── app.html
│   └── data/
│       ├── coa-umkm.json
│       └── firestore-structure.json
├── appsscript.json
└── PANDUAN_IMPLEMENTASI.md
```

---

## 2. Setup Firebase & Firestore

### Langkah 2.1: Buat Project Firebase

1. **Buka Firebase Console**
   - Kunjungi: https://console.firebase.google.com
   - Login dengan akun Google Anda

2. **Buat Project Baru**
   - Klik "Add project" atau "Tambah project"
   - Nama project: `umkm-accounting` (atau sesuai keinginan)
   - Google Analytics: Opsional (bisa diaktifkan atau tidak)
   - Klik "Create project"

### Langkah 2.2: Aktifkan Firestore Database

1. **Buka Firestore Database**
   - Di sidebar kiri, pilih "Build" > "Firestore Database"
   - Klik "Create database"

2. **Pilih Mode**
   - Pilih "Start in production mode"
   - Klik "Next"

3. **Pilih Location**
   - Pilih region terdekat: `asia-southeast1` (Singapore) atau `asia-southeast2` (Jakarta)
   - Klik "Enable"

### Langkah 2.3: Download Service Account Key

1. **Buka Project Settings**
   - Klik ikon gear ⚙️ di sebelah "Project Overview"
   - Pilih "Project settings"

2. **Buat Service Account**
   - Pilih tab "Service accounts"
   - Klik "Generate new private key"
   - Dialog konfirmasi akan muncul, klik "Generate key"
   - File JSON akan didownload

3. **Simpan Informasi Penting**
   Dari file JSON yang didownload, catat:
   - `client_email` (contoh: `firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com`)
   - `private_key` (dimulai dengan `-----BEGIN PRIVATE KEY-----`)
   - `project_id` (contoh: `umkm-accounting`)

### Langkah 2.4: Konfigurasi Firestore Security Rules

1. **Buka Firestore Rules**
   - Di Firestore Database, pilih tab "Rules"

2. **Paste Rules Berikut**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function untuk cek user authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function untuk cek user role
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Helper function untuk cek company access
    function hasCompanyAccess(companyId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAdmin();
    }

    // Companies collection
    match /companies/{companyId} {
      allow read: if hasCompanyAccess(companyId);
      allow write: if isAdmin() && hasCompanyAccess(companyId);
    }

    // Accounts collection
    match /accounts/{accountId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Customers & Suppliers
    match /customers/{customerId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /suppliers/{supplierId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Products
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Journals dan Transactions (user bisa write)
    match /journals/{journalId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();

      match /entries/{entryId} {
        allow read, write: if isAuthenticated();
      }
    }

    match /transactions/{transactionId} {
      allow read, write: if isAuthenticated();
    }

    match /capitals/{capitalId} {
      allow read, write: if isAuthenticated();
    }

    // Inventory
    match /inventory/{inventoryId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Receivables & Payables
    match /receivables/{receivableId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    match /payables/{payableId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    match /payments/{paymentId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Settings
    match /settings/{companyId} {
      allow read: if hasCompanyAccess(companyId);
      allow write: if isAdmin() && hasCompanyAccess(companyId);
    }
  }
}
```

3. **Publish Rules**
   - Klik "Publish" untuk menerapkan rules

---

## 3. Setup Google Apps Script

### Langkah 3.1: Buat Project Google Apps Script

1. **Buka Apps Script**
   - Kunjungi: https://script.google.com
   - Login dengan akun Google yang sama

2. **Buat Project Baru**
   - Klik "New project"
   - Rename project menjadi: "UMKM Accounting System"

### Langkah 3.2: Upload File Backend

1. **Copy File .gs**
   Copy semua file dari folder `src/backend/` ke Apps Script:

   - **Code.gs** - Main entry point
   - **FirebaseConfig.gs** - Konfigurasi Firebase
   - **Authentication.gs** - Sistem autentikasi
   - **MasterData.gs** - Manajemen master data
   - **Journal.gs** - Manajemen jurnal
   - **Reports.gs** - Laporan keuangan
   - **Inventory.gs** - Manajemen persediaan
   - **DebtReceivable.gs** - Manajemen piutang/utang

2. **Upload File HTML**
   Copy file HTML dari folder `src/frontend/`:

   - Klik ikon ➕ > HTML
   - Buat file: `src/frontend/index`
   - Copy isi dari `index.html`
   - Ulangi untuk `src/frontend/css/styles` dan `src/frontend/js/app`

### Langkah 3.3: Konfigurasi Firebase di Apps Script

1. **Tambahkan Library Firestore**
   - Di Apps Script, klik "Libraries" (ikon ➕ di sidebar)
   - Masukkan Script ID: `1VUSl4b1r1eoNcRWotZM3e87ygkxvXltOgyDZhixqncz9lQ3MjfT1iKFw`
   - Pilih versi terbaru
   - ID: `FirestoreApp`
   - Klik "Add"

2. **Set Script Properties**
   - Klik "Project Settings" (ikon ⚙️)
   - Scroll ke "Script Properties"
   - Klik "Add script property"

   Tambahkan 3 properties berikut:

   | Property | Value |
   |----------|-------|
   | `FIREBASE_EMAIL` | [client_email dari service account] |
   | `FIREBASE_KEY` | [private_key dari service account] |
   | `FIREBASE_PROJECT_ID` | [project_id dari Firebase] |

   **PENTING**:
   - Untuk `FIREBASE_KEY`, copy seluruh private key termasuk `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`
   - Pastikan tidak ada spasi atau enter tambahan

### Langkah 3.4: Test Koneksi

1. **Buka Code.gs**
2. **Pilih function** `testConnection` dari dropdown
3. **Klik Run** (▶️)
4. **Authorize** aplikasi jika diminta
5. **Check Logs** (View > Logs atau Ctrl+Enter)
   - Harus muncul: "✓ Koneksi ke Firestore berhasil!"

---

## 4. Deploy Web App

### Langkah 4.1: Deploy as Web App

1. **Klik Deploy** > "New deployment"

2. **Select Type**
   - Klik ⚙️ > Select "Web app"

3. **Konfigurasi**
   - **Description**: "Initial deployment" atau "v1.0"
   - **Execute as**: "Me (your-email@gmail.com)"
   - **Who has access**: "Anyone" (untuk testing) atau "Anyone with Google account"

4. **Deploy**
   - Klik "Deploy"
   - **COPY URL** yang diberikan (contoh: `https://script.google.com/macros/s/AKfycbxxx.../exec`)
   - Simpan URL ini untuk akses aplikasi

### Langkah 4.2: Setup Awal Data

1. **Buka Apps Script Editor**

2. **Jalankan Setup Functions**

   a. **Buat User Admin**
   ```javascript
   // Pilih function: testCreateUser
   // Edit email sesuai email Anda
   ```

   b. **Buat Company**
   ```javascript
   // Pilih function: testCreateCompany
   // Edit data sesuai perusahaan Anda
   ```

3. **Verify di Firestore**
   - Buka Firebase Console > Firestore Database
   - Check collection `users` dan `companies`
   - Check collection `accounts` (harus otomatis terisi Chart of Accounts)

---

## 5. Konfigurasi Security Rules

### OAuth Scopes

Pastikan `appsscript.json` memiliki scopes berikut:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}
```

### User Permissions

Sistem memiliki 2 level user:

1. **Admin**
   - Full access ke semua menu
   - Bisa mengelola master data
   - Bisa void/edit jurnal
   - Bisa mengelola user lain

2. **User**
   - Akses: Jurnal (Penerimaan & Pengeluaran)
   - Akses: Semua Laporan
   - Akses: View Persediaan
   - Akses: View Piutang & Utang
   - TIDAK bisa: Edit master data

---

## 6. Testing & Troubleshooting

### Testing Checklist

- [ ] Koneksi ke Firestore berhasil
- [ ] User admin berhasil dibuat
- [ ] Company berhasil dibuat
- [ ] Chart of Accounts terisi otomatis
- [ ] Web app bisa diakses
- [ ] Login berhasil (dengan email Google)
- [ ] Dashboard menampilkan data
- [ ] Master data bisa diakses
- [ ] Bisa membuat transaksi penerimaan
- [ ] Bisa membuat transaksi pengeluaran
- [ ] Laporan keuangan bisa ditampilkan

### Common Issues & Solutions

#### Issue 1: "Firebase configuration is missing"
**Solusi**:
- Check Script Properties sudah diisi dengan benar
- Pastikan `FIREBASE_KEY` termasuk BEGIN dan END marker
- Restart Apps Script editor

#### Issue 2: "Permission denied" di Firestore
**Solusi**:
- Check Firestore Rules sudah dipublish
- Pastikan user sudah terdaftar di collection `users`
- Check `companyId` user sesuai dengan data yang diakses

#### Issue 3: Web app tidak bisa diakses
**Solusi**:
- Re-deploy web app
- Check "Who has access" setting
- Clear browser cache
- Try incognito mode

#### Issue 4: "User not authenticated"
**Solusi**:
- Pastikan login dengan email yang terdaftar
- Check collection `users` di Firestore
- Buat user baru dengan `createUser()`

#### Issue 5: Data tidak muncul di dashboard
**Solusi**:
- Check browser console untuk error
- Verify Firestore has data
- Check user `companyId` sesuai dengan data company

### Debug Mode

Untuk enable logging:

```javascript
// Di Code.gs, tambahkan di awal function
function yourFunction() {
  Logger.log('Debug: Starting function');
  // ... your code
  Logger.log('Debug: Function completed');
}

// View logs: View > Logs (Ctrl+Enter)
```

---

## 7. Maintenance & Backup

### Backup Firestore Data

1. **Manual Export**
   - Firebase Console > Firestore Database
   - Klik tab "Usage"
   - Gunakan "Export" feature (berbayar untuk project besar)

2. **Script Backup**
   ```javascript
   // Buat function backup di Apps Script
   function backupToSheet() {
     // Export data ke Google Sheets
     // ... implementation
   }
   ```

### Monitoring

1. **Firebase Console**
   - Monitor reads/writes di "Usage" tab
   - Check error logs di "Cloud Logging"

2. **Apps Script**
   - Monitor executions di "Executions" tab
   - Check quota usage

### Update & Maintenance

1. **Update Code**
   - Edit di Apps Script Editor
   - Test di development
   - Deploy new version (Deploy > New deployment)

2. **Database Migration**
   - Jika ada perubahan structure
   - Buat migration script
   - Test di Firestore copy dulu

### Backup Recommendations

- **Daily**: Export journal entries
- **Weekly**: Full database export
- **Monthly**: Archive old data

---

## 8. Fitur-Fitur Sistem

### Menu Admin (Full Access)

1. **Dashboard**
   - Total Kas & Bank
   - Pendapatan bulan ini
   - Pengeluaran bulan ini
   - Laba bulan ini
   - Peringatan (stok rendah, piutang jatuh tempo)

2. **Master Data**
   - Daftar Akun (Chart of Accounts)
   - Daftar Pelanggan
   - Daftar Pemasok
   - Daftar Barang/Jasa

3. **Jurnal**
   - Penerimaan (kas masuk)
   - Pengeluaran (kas keluar)
   - Modal (investasi/penarikan)
   - Semua Jurnal

4. **Laporan**
   - Laporan Laba Rugi
   - Neraca (Laporan Posisi Keuangan)
   - Laporan Arus Kas
   - Neraca Saldo
   - Buku Besar

5. **Persediaan**
   - Barang Masuk
   - Barang Keluar
   - Penyesuaian Stok
   - Laporan Stok
   - Kartu Stok

6. **Utang & Piutang**
   - Daftar Piutang
   - Pembayaran Piutang
   - Aging Piutang
   - Daftar Utang
   - Pembayaran Utang

### Menu User (Limited Access)

- ✅ Dashboard (read-only)
- ❌ Master Data (tidak bisa akses)
- ✅ Jurnal Penerimaan & Pengeluaran (bisa input)
- ✅ Semua Laporan (read-only)
- ✅ Persediaan (read-only)
- ✅ Utang & Piutang (read-only)

---

## 9. Chart of Accounts Standar UMKM

Sistem ini sudah dilengkapi dengan Chart of Accounts standar untuk UMKM Indonesia:

### 1. ASET (1-xxxx)
- **1-1xxx**: Aset Lancar
  - 1-1001: Kas
  - 1-1002: Bank
  - 1-1003: Piutang Usaha
  - 1-1004: Persediaan Barang Dagangan
  - 1-1005: Uang Muka Pembelian

- **1-2xxx**: Aset Tetap
  - 1-2001: Peralatan Usaha
  - 1-2002: Kendaraan
  - 1-2003: Akumulasi Penyusutan

### 2. KEWAJIBAN (2-xxxx)
- **2-1xxx**: Kewajiban Lancar
  - 2-1001: Utang Usaha
  - 2-1002: Utang Bank Jangka Pendek
  - 2-1003: Utang Gaji

- **2-2xxx**: Kewajiban Jangka Panjang
  - 2-2001: Utang Bank Jangka Panjang

### 3. EKUITAS (3-xxxx)
- 3-0001: Modal Pemilik
- 3-0002: Prive/Penarikan Modal
- 3-0003: Laba Ditahan
- 3-0004: Laba Tahun Berjalan

### 4. PENDAPATAN (4-xxxx)
- 4-0001: Pendapatan Penjualan
- 4-0002: Pendapatan Jasa
- 4-0003: Pendapatan Lain-lain
- 4-1001: Retur Penjualan
- 4-1002: Potongan Penjualan

### 5. BEBAN POKOK PENJUALAN (5-xxxx)
- 5-0001: Pembelian Barang Dagangan
- 5-0002: Beban Angkut Pembelian
- 5-0003: Retur Pembelian

### 6. BEBAN OPERASIONAL (6-xxxx)
- **6-1xxx**: Beban Penjualan
  - 6-1001: Beban Gaji Karyawan
  - 6-1002: Beban Sewa Tempat
  - 6-1003: Beban Listrik & Air
  - 6-1004: Beban Telepon & Internet
  - 6-1005: Beban Pemasaran
  - 6-1006: Beban Transportasi
  - 6-1007: Beban Perlengkapan
  - 6-1008: Beban Pemeliharaan
  - 6-1009: Beban Penyusutan

- **6-2xxx**: Beban Administrasi & Umum
  - 6-2001: Beban Alat Tulis Kantor
  - 6-2002: Beban Perizinan
  - 6-2003: Beban Lain-lain

### 7. PENDAPATAN & BEBAN LAIN (7-xxxx)
- 7-0001: Pendapatan Bunga
- 7-1001: Beban Bunga

---

## 10. Best Practices

### Data Entry

1. **Konsisten dalam penamaan**
   - Gunakan format yang sama untuk customer/supplier names
   - Gunakan singkatan yang konsisten

2. **Regular backup**
   - Export data setiap akhir bulan
   - Simpan di Google Drive atau local storage

3. **Reconciliation**
   - Cek trial balance setiap bulan
   - Pastikan debit = credit
   - Rekonsiliasi dengan bank statement

4. **User Management**
   - Review user access secara berkala
   - Hapus user yang sudah tidak aktif
   - Update role sesuai kebutuhan

### Security

1. **Jangan share Service Account Key**
   - File JSON berisi credentials rahasia
   - Jangan upload ke public repository

2. **Regular password change**
   - Untuk akun Google yang digunakan

3. **Monitor access logs**
   - Check Firebase logs untuk aktivitas mencurigakan

### Performance

1. **Indexes**
   - Firestore akan suggest composite indexes
   - Create indexes saat muncul error

2. **Batch operations**
   - Untuk import data besar, gunakan batch write

3. **Pagination**
   - Untuk data yang banyak, implement pagination

---

## 11. Troubleshooting Lanjutan

### Performance Issues

**Problem**: Aplikasi lambat loading data

**Solution**:
1. Check Firestore indexes
2. Reduce data per query (pagination)
3. Cache frequently accessed data
4. Optimize Firestore queries

### Data Integrity Issues

**Problem**: Saldo tidak balance

**Solution**:
1. Check all journal entries (debit = credit)
2. Verify posted journals
3. Run trial balance report
4. Check for void journals

### Access Issues

**Problem**: User tidak bisa akses certain features

**Solution**:
1. Check user role in Firestore
2. Verify `canAccessFeature()` function
3. Check frontend role-based rendering
4. Verify Firestore security rules

---

## 12. Support & Documentation

### Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Apps Script Documentation**: https://developers.google.com/apps-script
- **Firestore Library**: https://github.com/grahamearley/FirestoreGoogleAppsScript

### Getting Help

1. Check Firebase Console logs
2. Check Apps Script execution logs
3. Browser console for frontend errors
4. Test individual functions in Apps Script

### Contact & Support

Untuk support lebih lanjut:
- Email: [your-support-email]
- Issues: [GitHub repository]

---

## 13. Changelog & Updates

### Version 1.0 (Initial Release)
- ✅ Complete accounting system
- ✅ Multi-user support
- ✅ Role-based access control
- ✅ Standard UMKM Chart of Accounts
- ✅ Financial reports
- ✅ Inventory management
- ✅ Receivable & Payable tracking

### Future Enhancements
- [ ] Multi-currency support
- [ ] Advanced reporting (charts/graphs)
- [ ] Email notifications
- [ ] PDF export for reports
- [ ] Mobile-responsive improvements
- [ ] Integration with e-commerce platforms

---

## Selamat Menggunakan Sistem Keuangan UMKM! 🎉

Semoga sistem ini membantu mengelola keuangan UMKM Anda dengan lebih baik dan terstruktur.
