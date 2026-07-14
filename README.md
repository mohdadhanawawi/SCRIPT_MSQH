# Script Ketua Unit / Penyelia — Sesi Audit Surveyor

Webapp ringkas untuk Ketua Unit / Penyelia melengkapkan script bacaan semasa
lawatan surveyor, berdasarkan dokumen "Script untuk Ketua Unit Updated".

## Ciri-ciri

- Pilih kawasan: Jimnasium, Elektroterapi, Hidroterapi, Women's Health / Men's
  Health, Neurojim, Bilik 26, atau Bilik A (SCACC).
- Ruang kosong (bergaris) dalam script boleh diisi/disunting terus dalam
  borang.
- **Simpan** — data disimpan terus dalam **Google Sheet**, boleh dilihat dan
  dikemaskini oleh semua pengguna (senarai rekod dikemaskini automatik setiap
  ~20 saat).
- **Cetak** — cetak atau jana PDF terus dari pelayar, dengan susun atur khas
  untuk cetakan.
- Muat turun / muat naik sandaran data dalam format JSON.

## Setup Google Sheets (perlu buat sekali sahaja)

Webapp ini perlukan satu Google Sheet + Google Apps Script (kedua-duanya
percuma, guna akaun Google/Gmail anda) sebagai storan data pusat.

1. Pergi ke [sheets.google.com](https://sheets.google.com), cipta spreadsheet
   baru, namakan apa-apa (contoh: `Data Script MSQH`).
2. Dalam spreadsheet, klik menu **Extensions → Apps Script**.
3. Padam semua kod contoh (`function myFunction() {...}`) dalam editor yang
   terbuka.
4. Buka fail [`apps-script/Code.gs`](./apps-script/Code.gs) di repo ini,
   salin **semua** kandungannya, dan tampal ke dalam editor Apps Script tadi.
5. Klik ikon **Save** (atau Ctrl+S), boleh namakan projek apa-apa.
6. Klik **Deploy → New deployment**.
   - Klik ikon gear di sebelah "Select type" → pilih **Web app**.
   - Description: apa-apa (contoh: `v1`).
   - **Execute as**: `Me`.
   - **Who has access**: `Anyone`.
   - Klik **Deploy**.
7. Google akan minta kebenaran akses (**Authorize access**):
   - Pilih akaun Google anda.
   - Jika muncul skrin "Google hasn't verified this app", klik **Advanced**
     → **Go to (nama projek) (unsafe)**. Ini normal kerana skrip ini kod
     sendiri, belum didaftar dengan Google — selamat untuk diteruskan.
   - Klik **Allow**.
8. Selepas deploy selesai, Google akan papar **Web app URL** (bentuknya
   `https://script.google.com/macros/s/AKfycb.../exec`). **Salin URL ini.**
9. Buka fail [`config.js`](./config.js) di repo ini, gantikan
   `GANTI_DENGAN_URL_APPS_SCRIPT_ANDA` dengan URL yang disalin tadi, contoh:
   ```js
   export const API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
10. Commit dan push perubahan `config.js`, dan pastikan ia turut berada di
    branch `main` (branch yang digunakan GitHub Pages) supaya laman live
    guna URL yang betul.

Selepas itu, data yang disimpan oleh mana-mana penyelia akan terus muncul
dalam sheet "Records" pada Google Sheet tersebut, dan boleh dilihat oleh
semua pengguna webapp.

### Kemaskini kod Apps Script

Jika `apps-script/Code.gs` diubah pada masa hadapan, kod dalam editor Apps
Script (langkah 2–5 di atas) perlu dikemaskini secara manual dengan
salin-tampal semula, kemudian **Deploy → Manage deployments → Edit (ikon
pensel) → Deploy** supaya versi terkini digunakan.

### Nota keselamatan

Web app Apps Script disetkan **Who has access: Anyone**, bermakna sesiapa
yang tahu URL boleh baca dan tulis data (tiada log masuk/pengesahan
pengguna). Ini cukup untuk kegunaan dalaman unit/jabatan yang tidak
terdedah kepada awam. Jangan kongsikan URL Apps Script secara terbuka di
luar kumpulan penyelia.

## Guna secara tempatan

Buka `index.html` terus di pelayar, atau jalankan pelayan statik ringkas:

```bash
python3 -m http.server 8000
```

Kemudian layari `http://localhost:8000`. (Perlu `config.js` sudah diisi
dengan URL Apps Script dan sambungan internet untuk storan berfungsi.)

## Publish ke GitHub Pages

1. Push repo ini ke GitHub, pastikan fail `config.js` yang lengkap turut ada
   di branch `main`.
2. Pergi ke **Settings → Pages**.
3. Pilih source: **Deploy from a branch** → branch `main` → folder
   `/ (root)` → **Save**.
4. Laman akan tersedia di `https://<username>.github.io/<repo>/` dalam masa
   1–2 minit selepas setiap push.

## Nota

Semua data disimpan dalam Google Sheet (bukan pada peranti pengguna) —
ini membolehkan semua penyelia melihat dan mengemaskini rekod yang sama.
Butang "Muat Turun Sandaran (JSON)" masih disediakan untuk sandaran manual
data.
