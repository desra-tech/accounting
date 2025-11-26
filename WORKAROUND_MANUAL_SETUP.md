# 🔧 Manual Setup Workaround - Firestore Console

## ⚠️ Kapan Menggunakan Workaround Ini?

Gunakan panduan ini jika Anda mendapat error **"Invalid argument: key"** saat menjalankan:
- `testCreateUserFirstTime()`
- `testCreateUser()`
- `testGetCurrentUser()`

Error ini terjadi karena masalah kompatibilitas antara FirestoreApp library dan format private key, meskipun koneksi Firebase sudah berhasil.

## 📋 Langkah-Langkah Manual Setup

### Step 1: Buat User Manual di Firestore Console

1. **Buka Firebase Console**
   - Login ke https://console.firebase.google.com
   - Pilih project Anda

2. **Buka Firestore Database**
   - Di sidebar kiri, klik **Firestore Database**
   - Klik tab **Data** (jika belum terbuka)

3. **Buat Collection 'users'**
   - Klik **Start collection**
   - Collection ID: `users`
   - Klik **Next**

4. **Buat User Document**
   - **Document ID**: Klik **Auto-ID** (akan generate ID otomatis, contoh: `adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2`)
   - **COPY Document ID ini!** Anda akan membutuhkannya nanti.

5. **Tambahkan Fields untuk User**

   Klik **Add field** dan isi satu per satu:

   | Field | Type | Value |
   |-------|------|-------|
   | `uid` | string | *Paste Document ID yang sama* |
   | `email` | string | *Email Google Anda* (contoh: `admin@gmail.com`) |
   | `displayName` | string | `Admin User` |
   | `role` | string | `admin` |
   | `companyId` | string | *(kosongkan dulu)* |
   | `isActive` | boolean | `true` |
   | `createdAt` | timestamp | *Klik "Set to current time"* |
   | `updatedAt` | timestamp | *Klik "Set to current time"* |

6. **Klik Save**

### Step 2: Verifikasi User di Apps Script

1. **Buka Google Apps Script**
   - Buka project Apps Script Anda
   - Buka file `Code.gs`

2. **Edit function `testGetUserByIdManual()`**

   Cari baris ini (sekitar line 306):
   ```javascript
   const userId = 'PASTE_DOCUMENT_ID_DISINI';
   ```

   Ganti dengan Document ID yang Anda copy tadi:
   ```javascript
   const userId = 'adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2';  // Contoh, ganti dengan ID Anda
   ```

3. **Run `testGetUserByIdManual()`**
   - Pilih function: `testGetUserByIdManual`
   - Klik **Run**
   - Lihat **Logs** (View > Logs atau Ctrl+Enter)

4. **Expected Output**:
   ```
   🔍 Mengambil user dengan ID: adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2
   ✅ User found!
      Email: admin@gmail.com
      Role: admin
      Company ID: (belum ada)
   ```

✅ **Jika berhasil, lanjut ke Step 3!**

### Step 3: Buat Company Manual

1. **Edit function `testCreateCompanyManual()`**

   Cari baris ini (sekitar line 336):
   ```javascript
   const userId = 'PASTE_DOCUMENT_ID_DISINI';
   ```

   Ganti dengan Document ID user Anda:
   ```javascript
   const userId = 'adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2';  // ID yang sama dengan Step 2
   ```

2. **Customize Data Company** (Opsional)

   Edit data company sesuai kebutuhan (line 345-352):
   ```javascript
   const newCompany = {
     id: companyId,
     name: 'UMKM Contoh',              // ← Ganti nama perusahaan Anda
     address: 'Jl. Contoh No. 123',    // ← Ganti alamat
     phone: '08123456789',             // ← Ganti nomor telepon
     email: 'info@umkmcontoh.com',     // ← Ganti email perusahaan
     taxId: '01.234.567.8-901.000',    // ← Ganti NPWP
     industry: 'Retail',               // ← Ganti industri
     // ... (sisanya otomatis)
   };
   ```

3. **Run `testCreateCompanyManual()`**
   - Pilih function: `testCreateCompanyManual`
   - Klik **Run**
   - **PENTING**: Proses ini akan memakan waktu karena membuat 57 akun COA
   - Tunggu hingga selesai (sekitar 30-60 detik)

4. **Expected Output**:
   ```
   🏢 Membuat company...
      Company ID: [generated-uuid]
      Name: UMKM Contoh
   ✅ Company created!

   🔄 Update user dengan companyId...
   ✅ User updated!

   📊 Initialize Chart of Accounts (57 akun)...
   ✅ COA initialized!

   ⚙️  Initialize Settings...
   ✅ Settings initialized!

   🎉 ===== SEMUA SETUP BERHASIL! =====
      Company ID: [generated-uuid]
      User ID: adf6b720-f7f7-49d0-bca0-5f0ffd1f75d2

   📝 Next: Deploy Web App dan akses aplikasi!
   ```

### Step 4: Verifikasi di Firestore Console

Kembali ke Firestore Console dan pastikan collections berikut sudah ada:

1. **users** (1 document) ✅
   - Field `companyId` sudah terisi

2. **companies** (1 document) ✅
   - Berisi data perusahaan Anda

3. **accounts** (57 documents) ✅
   - Chart of Accounts standar UMKM

4. **settings** (1 document) ✅
   - Konfigurasi sistem

### Step 5: Deploy Web App

1. **Di Apps Script Editor**
   - Klik **Deploy** > **New deployment**
   - Type: **Web app**
   - Description: `Initial deployment`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**

2. **Copy Web App URL**
   - Format: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
   - Save URL ini

3. **Akses Web App**
   - Paste URL di browser
   - Login dengan email Google yang Anda gunakan
   - Anda akan melihat Dashboard sistem keuangan

## 🎉 Setup Selesai!

Sekarang Anda bisa:
- ✅ Login ke web app
- ✅ Akses Dashboard
- ✅ Input transaksi (Penerimaan, Pengeluaran)
- ✅ Kelola Master Data
- ✅ Generate Laporan Keuangan

## 🐛 Troubleshooting

### Error: "User not found" di testGetUserByIdManual()

**Penyebab**: Document ID salah atau user belum dibuat

**Solusi**:
1. Buka Firestore Console
2. Cek collection `users`
3. Klik document user Anda
4. Copy Document ID yang benar (di atas fields, bukan di dalam fields)
5. Paste ke function

### Error saat testCreateCompanyManual()

**Penyebab**: User ID tidak valid atau Firebase credentials salah

**Solusi**:
1. Pastikan `userId` di function sudah benar
2. Run `testGetUserByIdManual()` dulu untuk verify
3. Cek Firebase credentials di Script Properties
4. Pastikan Service Account punya permission **Cloud Datastore User**

### COA tidak lengkap (kurang dari 57 akun)

**Penyebab**: Timeout atau error saat loop

**Solusi**:
1. Cek Firestore Console > collection `accounts`
2. Hitung jumlah documents
3. Jika kurang, hapus semua accounts dan run ulang `testCreateCompanyManual()`

### Web App tidak bisa diakses

**Penyebab**: Deployment settings salah

**Solusi**:
1. Redeploy dengan settings:
   - Execute as: **Me** (bukan User accessing the web app)
   - Who has access: **Anyone** atau **Anyone with Google account**
2. Authorize aplikasi jika diminta
3. Copy URL baru dan akses

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:
1. Cek **Execution logs** di Apps Script (View > Executions)
2. Cek **Firestore security rules** (pastikan allow read/write untuk testing)
3. Verify Service Account permissions di GCP Console

---

**Selamat! Sistem Keuangan UMKM Anda sudah siap digunakan! 🎊**
