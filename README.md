# 💼 Sistem Informasi Keuangan UMKM

Sistem informasi keuangan berbasis web untuk UMKM (Usaha Mikro Kecil dan Menengah) yang dibangun menggunakan **Google Apps Script** dan **Firebase Firestore**.

## 📋 Fitur Utama

### 1. 📊 Dashboard
- Ringkasan keuangan real-time
- Total kas & bank
- Pendapatan dan pengeluaran bulan berjalan
- Laba/rugi bulan berjalan
- Peringatan otomatis (stok rendah, piutang jatuh tempo)

### 2. 📝 Jurnal Transaksi
- **Menu Penerimaan**: Mencatat uang masuk (pendapatan penjualan/jasa)
- **Menu Pengeluaran**: Mencatat uang keluar (biaya operasional)
- **Menu Modal**: Mencatat investasi atau penarikan modal
- Sistem double-entry bookkeeping otomatis
- Validasi debit = kredit

### 3. 📋 Master Data
- **Daftar Akun**: Chart of Accounts standar UMKM Indonesia
- **Daftar Pelanggan**: Database pelanggan dengan tracking piutang
- **Daftar Pemasok**: Database pemasok dengan tracking utang
- **Daftar Barang/Jasa**: Katalog produk dengan harga beli/jual

### 4. 📈 Laporan Keuangan
- **Laporan Laba Rugi**: Ringkasan pendapatan, beban, dan laba/rugi
- **Neraca (Laporan Posisi Keuangan)**: Aset, kewajiban, dan ekuitas
- **Laporan Arus Kas**: Aliran kas dari aktivitas operasi, investasi, dan pendanaan
- **Neraca Saldo**: Trial balance untuk rekonsiliasi
- **Buku Besar**: Detailed ledger per akun

### 5. 📦 Manajemen Persediaan
- Pencatatan barang masuk (stock in)
- Pencatatan barang keluar (stock out)
- Penyesuaian stok
- Kartu stok per produk
- Laporan stok dan nilai persediaan
- Peringatan stok rendah

### 6. 💳 Utang & Piutang
- **Piutang Usaha**: Tracking piutang pelanggan
- **Pembayaran Piutang**: Pencatatan pelunasan piutang
- **Aging Piutang**: Analisis umur piutang (0-30, 31-60, 61-90, >90 hari)
- **Utang Usaha**: Tracking utang ke supplier
- **Pembayaran Utang**: Pencatatan pelunasan utang

## 🎯 Keunggulan Sistem

✅ **Gratis** - Menggunakan Firebase free tier dan Google Apps Script
✅ **Cloud-based** - Akses dari mana saja, kapan saja
✅ **Real-time** - Data tersinkronisasi secara real-time
✅ **Multi-user** - Mendukung banyak user dengan role-based access
✅ **Aman** - Dilindungi Firebase Authentication dan Security Rules
✅ **Standar Akuntansi** - Menggunakan Chart of Accounts standar UMKM Indonesia
✅ **Mudah digunakan** - Interface sederhana dan intuitif

## 👥 User Roles

### Admin
- ✅ Akses penuh ke semua menu
- ✅ Mengelola master data
- ✅ Input dan edit semua transaksi
- ✅ View semua laporan
- ✅ Mengelola user lain

### User
- ✅ Dashboard & Laporan (read-only)
- ✅ Input transaksi penerimaan & pengeluaran
- ✅ View persediaan & utang-piutang
- ❌ Tidak bisa edit master data

## 🚀 Quick Start

### Persiapan
1. Akun Google (Gmail)
2. Akun Firebase (gratis di https://firebase.google.com)
3. Browser modern

### Instalasi

**Langkah 1: Setup Firebase**
- Buat project di Firebase Console
- Aktifkan Firestore Database
- Download Service Account Key

**Langkah 2: Setup Google Apps Script**
- Buat project baru di script.google.com
- Copy semua file dari `src/backend/`
- Upload file HTML dari `src/frontend/`
- Set Script Properties (Firebase credentials)

**Langkah 3: Deploy**
- Deploy as Web App
- Jalankan setup initial data
- Akses aplikasi via URL

### Dokumentasi Lengkap

📚 **[PANDUAN_IMPLEMENTASI.md](./PANDUAN_IMPLEMENTASI.md)** - Panduan lengkap step-by-step

## 📁 Struktur Proyek

```
accounting/
├── src/
│   ├── backend/                 # Google Apps Script files
│   ├── frontend/                # HTML/CSS/JS files
│   └── data/                    # COA & schema
├── appsscript.json
├── PANDUAN_IMPLEMENTASI.md
└── README.md
```

## 🗄️ Database Collections (Firestore)

- `users`, `companies`, `accounts`
- `customers`, `suppliers`, `products`
- `journals`, `transactions`, `capitals`
- `inventory`, `receivables`, `payables`, `payments`
- `settings`

## 📊 Chart of Accounts

- **1-xxxx**: ASET
- **2-xxxx**: KEWAJIBAN
- **3-xxxx**: EKUITAS
- **4-xxxx**: PENDAPATAN
- **5-xxxx**: BEBAN POKOK PENJUALAN
- **6-xxxx**: BEBAN OPERASIONAL
- **7-xxxx**: PENDAPATAN & BEBAN LAIN

## 🛠️ Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Google Apps Script
- Database: Firebase Firestore
- Hosting: Google Apps Script Web App

## 📈 Roadmap

### Version 1.0 ✅
- [x] Complete accounting system
- [x] Multi-user & role-based access
- [x] Financial reports
- [x] Inventory & debt/receivable management

### Future 🚀
- [ ] Multi-currency support
- [ ] Charts & graphs
- [ ] PDF export
- [ ] Mobile app
- [ ] E-commerce integration

## 🐛 Troubleshooting

Lihat [PANDUAN_IMPLEMENTASI.md](./PANDUAN_IMPLEMENTASI.md) untuk troubleshooting lengkap.

## 📄 License

MIT License

## 👨‍💻 Developer

Developed for UMKM Indonesia 🇮🇩

---

**Happy Accounting! 📊💰**
