# Script Ketua Unit / Penyelia — Sesi Audit Surveyor

Webapp ringkas untuk Ketua Unit / Penyelia melengkapkan script bacaan semasa
lawatan surveyor, berdasarkan dokumen "Script untuk Ketua Unit Updated".

## Ciri-ciri

- Pilih kawasan: Jimnasium, Elektroterapi, Hidroterapi, Women's Health / Men's
  Health, Neurojim, Bilik 26, atau Bilik A (SCACC).
- Ruang kosong (bergaris) dalam script boleh diisi/disunting terus dalam
  borang.
- **Simpan** — data disimpan pada storan awan (Firebase Firestore) dan boleh
  dilihat/dikemaskini oleh **semua pengguna** secara langsung (live), tanpa
  kira peranti atau pelayar.
- **Cetak** — cetak atau jana PDF terus dari pelayar, dengan susun atur khas
  untuk cetakan.
- Muat turun / muat naik sandaran data dalam format JSON.

## Setup Firebase (perlu buat sekali sahaja)

Webapp ini perlukan projek Firebase (percuma) untuk storan awan supaya data
dikongsi antara semua pengguna. Tanpa setup ini, borang akan tunjuk mesej
"Gagal memuatkan sistem storan awan".

1. Pergi ke [Firebase Console](https://console.firebase.google.com/) dan log
   masuk dengan akaun Google (Gmail) anda.
2. Klik **Add project**, beri nama (contoh: `script-msqh`), boleh matikan
   Google Analytics (tidak diperlukan), klik **Create project**.
3. Dalam projek, klik ikon web `</>` untuk **Add app** → daftar dengan
   nickname (contoh: `script-msqh-web`) → tidak perlu Firebase Hosting →
   **Register app**.
4. Firebase akan papar kod config seperti berikut — salin nilai-nilai ini:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
5. Tampal nilai tersebut ke dalam fail [`firebase-config.js`](./firebase-config.js)
   di repo ini, gantikan nilai placeholder `GANTI_DENGAN_...`.
6. Dalam Firebase Console, pergi ke **Build → Firestore Database** → **Create
   database** → pilih lokasi server berdekatan (contoh: `asia-southeast1`)
   → mula dengan mana-mana mod (rules akan ditetapkan di langkah
   seterusnya).
7. Pergi ke tab **Rules** dalam Firestore Database, padam kandungan sedia
   ada, dan tampal kandungan fail [`firestore.rules`](./firestore.rules) dari
   repo ini, kemudian **Publish**.
8. Commit dan push perubahan `firebase-config.js`, kemudian pastikan
   perubahan ini turut berada di branch `main` (branch yang digunakan oleh
   GitHub Pages) supaya laman live menggunakan config yang betul.

### Nota keselamatan

`firestore.rules` yang disediakan membenarkan **sesiapa** dengan pautan
webapp membaca dan menulis data (tiada log masuk/pengesahan pengguna). Ini
cukup untuk kegunaan dalaman unit/jabatan yang tidak terdedah kepada
awam. Jika perlu lebih ketat (contoh: hanya staf log masuk dengan emel
hospital boleh menyimpan), Firebase Authentication boleh ditambah kemudian.

## Guna secara tempatan

Buka `index.html` terus di pelayar, atau jalankan pelayan statik ringkas:

```bash
python3 -m http.server 8000
```

Kemudian layari `http://localhost:8000`. (Perlu `firebase-config.js` sudah
diisi dan sambungan internet untuk storan awan berfungsi.)

## Publish ke GitHub Pages

1. Push repo ini ke GitHub, pastikan fail `firebase-config.js` yang lengkap
   turut ada di branch `main`.
2. Pergi ke **Settings → Pages**.
3. Pilih source: **Deploy from a branch** → branch `main` → folder
   `/ (root)` → **Save**.
4. Laman akan tersedia di `https://<username>.github.io/<repo>/` dalam masa
   1–2 minit selepas setiap push.

## Nota

Semua data disimpan pada Firebase Firestore (cloud), bukan pada peranti
pengguna — ini membolehkan semua penyelia melihat dan mengemaskini rekod
yang sama secara langsung. Butang "Muat Turun Sandaran (JSON)" masih
disediakan untuk sandaran manual data.
