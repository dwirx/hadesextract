# Text Extractor Pro

Text Extractor Pro adalah Chrome Extension (Manifest V3) untuk mengekstrak teks dari halaman web, merapikan format output, lalu memprosesnya dengan AI OpenRouter (Ringkas, Jelaskan, dan AI Chat berkelanjutan).

## Fitur Utama

### 1) Ekstraksi Teks
- Full Page: ambil teks dari seluruh halaman.
- Article: fokus ke konten utama (lebih minim noise).
- Select: pilih elemen tertentu dari halaman.

### 2) Format Output
- Structured
- Markdown
- Obsidian
- HTML
- JSON
- Plain text

### 3) Opsi Ekstraksi
- Headings
- Tables
- Links
- Images
- Clean Whitespace
- Remove Ads

### 4) AI Actions (OpenRouter)
- Ringkas: rangkuman terstruktur Bahasa Indonesia.
- Jelaskan: penjelasan bertahap Bahasa Indonesia, bisa pakai fokus topik.
- Prompt sudah dioptimasi agar:
  - minim halusinasi,
  - tetap berbasis sumber,
  - output lebih rapi dan konsisten.

### 5) View Original vs AI Result
Setelah proses AI, hasil original dan hasil AI disimpan terpisah. Kamu bisa toggle:
- Original
- AI Result

### 6) AI Chat (Context-Aware)
Tab baru `AI Chat` di popup:
- tanya jawab berbasis teks hasil ekstraksi,
- session bisa lanjut,
- bisa buat session baru,
- bisa hapus session,
- progress/thinking bar saat AI menjawab,
- copy satu pesan AI atau copy seluruh transcript chat.

### 7) History
Riwayat menyimpan:
- extraction item,
- hasil AI,
- snapshot chat.

`Clear All` akan membersihkan:
- IndexedDB history,
- local chat sessions.

### 8) Popup UX
- Popup bisa di-resize (drag kanan/kiri/bawah/pojok).
- Tombol `Reset Size` untuk kembali ke ukuran ideal.
- Tombol `Popout` untuk buka UI di tab penuh (lebih lega dari popup bawaan browser).

## Struktur Project

```text
.
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── content.js
│   ├── content.bundle.js
│   └── content.css
├── popup/
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   └── utils/
│       ├── db.js
│       └── index.js
├── options/
│   ├── options.html
│   └── options.js
├── icons/
├── CHANGELOG.md
├── TESTING.md
└── README.md
```

## Instalasi (Development)

1. Buka `chrome://extensions/`
2. Aktifkan `Developer mode`
3. Klik `Load unpacked`
4. Pilih folder root repository ini

## Build

Project ini tidak butuh build step wajib untuk runtime extension, tapi tersedia script untuk rebuild assets:

```bash
npm install
npm run build
```

Script yang tersedia:
- `npm run build:css`
- `npm run build:js`
- `npm run build`
- `npm run watch`

## Konfigurasi OpenRouter

Buka `Settings` dari popup, lalu isi:
- OpenRouter API Key
- Default Model

Tambahan di halaman settings:
- Show/Hide API key
- Test API
- Model Browser (sort terbaru/terlama, filter harga, search, pilih model)

Settings disimpan ke:
- `chrome.storage.local`
- `localStorage` (fallback)

## Cara Pakai Cepat

1. Klik extension icon.
2. Pilih mode ekstraksi (`Full Page`, `Article`, atau `Select`).
3. Pilih format output.
4. Klik `Ringkas` atau `Jelaskan` bila perlu AI output.
5. Gunakan toggle `Original` / `AI Result`.
6. Buka tab `AI Chat` untuk diskusi lanjutan berbasis context.

## Permissions

### `permissions`
- `activeTab`: akses tab aktif.
- `scripting`: inject content script saat diperlukan.
- `clipboardWrite`: copy teks/chat.
- `contextMenus`: menu klik kanan.
- `storage`: simpan settings dan data runtime.

### `host_permissions`
- `https://openrouter.ai/*`: request model list dan chat completion.

## Penyimpanan Data

- Extraction history: IndexedDB (`TextExtractorDB`, store `extractions`)
- Chat sessions: `localStorage` key `aiChatSessionsV1`
- Popup size: `localStorage` key `popupSize`
- Settings fallback: `localStorage` key `text_extractor_settings`

## Troubleshooting

### AI tidak jalan
- Pastikan API key valid di Settings.
- Cek `Test API` di Settings.
- Pastikan model tersedia dan kredensial OpenRouter memiliki kredit/akses.

### Drag resize terasa mentok
- Popup Chrome punya batas ukuran internal.
- Gunakan tombol `Popout` untuk mode tab penuh.

### Hasil ekstraksi kosong
- Coba mode `Full Page` lalu `Article`.
- Untuk halaman dinamis, refresh halaman dan ekstrak ulang.

## Manual Testing

Lihat checklist lengkap di:
- `TESTING.md`

## Changelog

Lihat perubahan versi di:
- `CHANGELOG.md`

## License

MIT
