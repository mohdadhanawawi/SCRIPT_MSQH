# Script Ketua Unit / Penyelia — Sesi Audit Surveyor

Webapp ringkas untuk Ketua Unit / Penyelia melengkapkan script bacaan semasa
lawatan surveyor, berdasarkan dokumen "Script untuk Ketua Unit Updated".

## Ciri-ciri

- Pilih kawasan: Jimnasium, Elektroterapi, Hidroterapi, Women's Health / Men's
  Health, Neurojim, Bilik 26, atau Bilik A (SCACC).
- Ruang kosong (bergaris) dalam script boleh diisi/disunting terus dalam
  borang.
- **Simpan** — data disimpan dalam pelayar (localStorage) mengikut kawasan.
- **Cetak** — cetak atau jana PDF terus dari pelayar, dengan susun atur khas
  untuk cetakan.
- Muat turun / muat naik sandaran data dalam format JSON (kerana data
  localStorage tersimpan setempat pada satu peranti/pelayar sahaja).

## Guna secara tempatan

Buka `index.html` terus di pelayar, atau jalankan pelayan statik ringkas:

```bash
python3 -m http.server 8000
```

Kemudian layari `http://localhost:8000`.

## Publish ke GitHub Pages

1. Push repo ini ke GitHub.
2. Pergi ke **Settings → Pages**.
3. Pilih source: branch `main` (atau branch berkenaan), folder `/ (root)`.
4. Simpan — laman akan tersedia di `https://<username>.github.io/<repo>/`.

## Nota

Semua penyimpanan data berlaku secara setempat (client-side) dalam pelayar
peranti pengguna. Tiada pelayan/backend digunakan. Untuk berkongsi data
antara peranti, guna butang "Muat Turun Sandaran (JSON)" dan "Muat Naik
Sandaran".
