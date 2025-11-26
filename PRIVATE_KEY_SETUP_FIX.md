# 🔑 Cara Benar Setup Firebase Private Key

## ⚠️ Masalah: "Invalid argument: key"

Error ini terjadi karena **format private key salah** di Script Properties. Private key perlu actual newlines (`Enter`), bukan literal string `\n`.

## ✅ Solusi 1: Paste dengan Newlines Asli

### Step 1: Download Service Account Key Lagi

1. Buka https://console.firebase.google.com
2. **Project Settings** (⚙️) > **Service Accounts**
3. Klik **Generate new private key**
4. Download file JSON (contoh: `umkm-accounting-firebase-adminsdk-xxxxx.json`)

### Step 2: Extract Private Key dengan Text Editor

1. **Buka file JSON** dengan text editor (Notepad++, VS Code, atau Sublime)
2. **Cari field `private_key`**:
   ```json
   {
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh...",
     ...
   }
   ```

3. **Copy VALUE private_key** (termasuk quotes)
4. **Paste ke text editor baru**
5. **Replace semua `\n` dengan actual ENTER**:

   **SEBELUM** (salah):
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
   ```

   **SESUDAH** (benar):
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   (banyak baris)
   ...
   -----END PRIVATE KEY-----
   ```

6. **Hapus quotes** di awal dan akhir

### Step 3: Paste ke Script Properties dengan Cara Khusus

**JANGAN paste langsung** ke Script Properties textbox! Itu akan corrupt newlines.

**Gunakan cara ini:**

1. **Buka Apps Script** project Anda
2. **Buat temporary function**:

   ```javascript
   function setupFirebaseKeyCorrectly() {
     const privateKey = `-----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   (paste semua baris private key di sini dengan newlines asli)
   ...
   -----END PRIVATE KEY-----
   `;

     PropertiesService.getScriptProperties().setProperty('FIREBASE_KEY', privateKey);
     Logger.log('✅ Private key berhasil disimpan dengan format yang benar!');
   }
   ```

3. **Paste private key** di antara backticks (` `` `) dengan format multi-line
4. **Run function** `setupFirebaseKeyCorrectly()`
5. **Hapus function** setelah selesai (untuk security)

### Step 4: Verify Format

Buat function untuk verify:

```javascript
function verifyPrivateKeyFormat() {
  const key = PropertiesService.getScriptProperties().getProperty('FIREBASE_KEY');

  Logger.log('Key length: ' + key.length);
  Logger.log('Has BEGIN marker: ' + key.includes('-----BEGIN PRIVATE KEY-----'));
  Logger.log('Has END marker: ' + key.includes('-----END PRIVATE KEY-----'));
  Logger.log('Number of newlines: ' + (key.match(/\n/g) || []).length);
  Logger.log('First 50 chars: ' + key.substring(0, 50));
  Logger.log('Last 50 chars: ' + key.substring(key.length - 50));

  // Expected:
  // - Length: 1600-1800 chars
  // - Has BEGIN/END markers
  // - At least 25-30 newlines
}
```

Run `verifyPrivateKeyFormat()` dan pastikan:
- ✅ Length: 1600-1800 chars
- ✅ Has BEGIN/END markers
- ✅ Newlines: 25-30+

---

## ✅ Solusi 2: Paste Raw Key (Tanpa Header/Footer)

Alternatif jika Solusi 1 masih error:

### Step 1: Extract Key Body Only

Dari private key, ambil **hanya isinya** (tanpa header/footer):

**SEBELUM**:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
banyak baris...
-----END PRIVATE KEY-----
```

**SESUDAH** (copy hanya ini):
```
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
banyak baris...
```

### Step 2: Join Semua Jadi Satu Baris

Gabungkan semua baris jadi **satu string panjang** (no spaces, no newlines):
```
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...banyak karakter...
```

### Step 3: Paste ke Script Properties

Paste string panjang itu ke Script Properties dengan key: `FIREBASE_KEY_RAW`

### Step 4: Modify createJWT Function

Edit `FirebaseRestAPI.gs`, ganti function `createJWT`:

```javascript
function createJWT(header, claim, key) {
  const headerStr = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const claimStr = Utilities.base64EncodeWebSafe(JSON.stringify(claim));
  const signatureInput = headerStr + '.' + claimStr;

  // Reconstruct PEM format
  const keyRaw = PropertiesService.getScriptProperties().getProperty('FIREBASE_KEY_RAW');
  const pemKey = '-----BEGIN PRIVATE KEY-----\n' +
                 keyRaw.match(/.{1,64}/g).join('\n') +
                 '\n-----END PRIVATE KEY-----\n';

  // Sign with RSA-SHA256
  const signature = Utilities.computeRsaSha256Signature(signatureInput, pemKey);
  const signatureStr = Utilities.base64EncodeWebSafe(signature);

  return signatureInput + '.' + signatureStr;
}
```

---

## 📝 Langkah Selanjutnya

1. **Coba Solusi 1** dulu (recommended)
2. Jika masih error, **coba Solusi 2**
3. Run `verifyPrivateKeyFormat()` untuk debug
4. Run `testGetUserViaREST()` lagi

Screenshot hasil verify dan saya bantu troubleshoot lebih lanjut! 🚀
