# Text Extractor Pro (HadesExtract)

**Text Extractor Pro** adalah ekstensi Google Chrome tangguh yang dirancang untuk mengekstrak, membersihkan, dan memformat teks dari halaman web mana pun. Dilengkapi dengan integrasi AI cerdas melalui OpenRouter, ekstensi ini tidak hanya mengambil konten tetapi juga membantu Anda merangkum, menjelaskan, dan berinteraksi dengan informasi tekstual dari web secara mulus.

---

## 🚀 Fitur Utama

### 1. Ekstraksi Teks Super Cerdas
- **Full Page:** Mengambil teks dari seluruh elemen bodi halaman web tanpa pandang bulu.
- **Article:** (Direkomendasikan) Menggunakan algoritma *Readability* untuk mengekstrak hanya bagian konten utama (artikel/blog), membuang iklan, navigasi, sidebar, dan *footer*. Terdapat dukungan Fast-Path khusus untuk Substack.
- **Select:** Mode interaktif untuk menyorot dan memilih elemen spesifik di DOM secara visual untuk diekstrak.

### 2. Multi-Format Output
Ekspor artikel dengan berbagai format yang siap pakai:
- **Structured:** Format teks rapi cocok untuk transkrip atau log.
- **Markdown:** Header, daftar, dan tautan dipertahankan (sempurna untuk Notion, GitHub, dsb).
- **Obsidian:** Format Markdown khusus yang menginkorporasikan meta-data *frontmatter* khas Obsidian.
- **HTML:** DOM steril dan aman dibersihkan dengan algoritma `DOMPurify`.
- **JSON:** Berguna untuk developer yang ingin mem-parsing struktur ke format data.
- **Plain Text:** Teks murni tanpa styling.

### 3. Pembersihan Konten (Opsi Ekstraksi)
Ambil kendali penuh atas detail ekstraksi Anda:
- **Headings:** Simpan otomatis tag H1-H6.
- **Tables:** Pertahankan tabel atau hapus dari hasil ekstraksi akhir.
- **Links:** Konversi tautan menjadi absolut atau ubah menjadi teks biasa.
- **Images:** Sisipkan gambar atau hilangkan sepenuhnya dari dokumen.
- **Clean Whitespace:** Hilangkan baris kosong berlebih.
- **Remove Ads:** (Langsung aktif pada mode Article).

### 4. Integrasi AI via OpenRouter
- **Ringkas:** Hasilkan rangkuman berstruktur otomatis (Heading, Poin, Kesimpulan) dalam Bahasa Indonesia.
- **Jelaskan:** Dapatkan penjelasan bertahap yang mendalam dari tulisan rumit yang sedang diekstrak.
- *Prompt* AI dirancang sangat teroptimasi untuk mengurangi probabilitas halusinasi, tetap memegang teguh pedoman sumber halaman, dan menghasilkan file Markdown yang sangat bersih.
- **Original vs AI Result:** Fitur eksklusif untuk membandingkan hasil asli ekstraksi dengan hasil rekayasa dari AI hanya dengan satu tombol (Toggle).

### 5. AI Chat Terintegrasi (Context-Aware)
Ingin berdiskusi lebih mendalam mengenai artikel?
- Mode *AI Chat* terpisah murni di dalam jendela Popup.
- AI langsung memuat konteks penuh dari teks hasil ekstraksi mentah tanpa batasan *copy-paste*, untuk menjawab pertanyaan yang spesifik.
- Preservasi histori sesi percakapan layaknya menggunakan ChatGPT.
- Mendukung *Progress/Thinking Bar* interaktif ketika menunggu respons API yang lama.

### 6. Mode Tampilan Fleksibel (Popup UX)
- **Resize:** Popup window bisa di-drag, dilebarkan, atau dijauhkan sesuai kenyamanan pandangan mata.
- **Popout Tab:** Buka UI ekstensi ke dalam bentuk tab browser spesifik berlayar penuh (`chrome-extension://.../popup/popup.html`). Sangat lega untuk membaca keseluruhan teks secara panjang atau *chatting*.

### 7. Penyimpanan & History Database
- Semua rekam jejak ekstraksi beserta preferensinya disimpan rapi dan otomatis di dalam `IndexedDB` browser (Cepat dan Sangat Ringan).
- Chat Session dan interaksi disimpan seketika dengan metadata yang lengkap.
- Opsi tombol `Clear All` difungsikan untuk menyetel / membersihkan data riwayat dalam satu ketukan mudah.

---

## 📁 Struktur Pengerjaan Project (Directory Layout)

```text
.
├── manifest.json       # Konfigurasi Extensi Inti (Manifest V3)
├── background/         # Service worker scripts untuk aktivitas background Chrome
├── content/            # Skrip terinjeksi manipulasi DOM pada halaman web spesifik
│   ├── content.js      # Logika ekstraksi teks DOM utama (Turndown, Readability)
│   ├── content.bundle.js # Build output untuk bundel script
│   └── content.css     # CSS helper / highlight UI saat mode Select pointer
├── popup/              # UI ekstensi yang dirender saat extension diklik
│   ├── popup.html
│   ├── popup.css       # Output tailwind build untuk desain extension
│   ├── popup.js        # Controller dan state logika popup utama
│   └── utils/          # Fungsi utility esensial, interaksi DB, dan tools
├── options/            # Frontend halaman opsi/pengaturan (/options/options.html)
├── icons/              # Berkas sumber logo aset & ikon
├── CHANGELOG.md        # Catatan rilis dan update teknikal historis
├── TESTING.md          # Manual testing runbook & checklist
└── README.md           # Basis Dokumentasi Utama
```

---

## ⚙️ Development & Build Procedure

Project ini menggunakan arsitektur Vanilla JS modern yang diperkaya dengan performa *bundler* `esbuild` dan kerangka gaya mutakhir `Tailwind CSS`. Maka dari itu, dependensi Node.js sangat krusial.

### 1. Install Dependencies
Pastikan [Node.js](https://nodejs.org/) versi terbaru sudah terpasang, lalu eksekusi di terminal:
```bash
npm install
```

### 2. Available NPM Scripts
- **`npm run build:css`** : Membangun dan me-minify instruksi file Tailwind utuh bermuara ke `popup/popup.css`.
- **`npm run build:js`** : Mem-bundle `content/content.js` menjadi `content.bundle.js` beserta kelengkapannya.
- **`npm run build`** : Menjalankan full build proses CSS dan JS sekaligus (Sangat disarankan / diwajibkan setidaknya sekali sebelum mulai mode *testing* eksistensi *unpacked extension*).
- **`npm run watch`** : Instruksi re-run spesifik untuk mode *watch* (Development *auto-rebuild* file style dan js ketika anda merubah satu baris logika atau visual CSS).

---

## 📦 Tahapan Instalasi di Ekosistem Google Chrome

Langkah-langkah esensial untuk memuat format pengembangan ekstensi ke *browser*:

1. Buka jalur terminal lalu kompilasikan bundlenya (WAJIB): `npm run build`.
2. Buka Google Chrome dan salin tautan internal ini ke kolom URL: `chrome://extensions/`.
3. Di pojok kanan atas layar browser Anda, pastikan telah menghidupkan dan menyalakan **Developer mode / Mode Pengembang**.
4. Klik tombol di bar atas yakni **Load unpacked**.
5. Telusuri sistem file lalu pilih direktori proyek utama repositori ini (yang setidaknya memuat berkas induk `manifest.json`).
6. Yay! Ekstensi "Text Extractor Pro" sukses termuat ke Chrome Anda dan icon extension seharusnya sudah muncul di panel atas *toolbar*.

---

## 🔑 Mengatur Konfigurasi OpenRouter (Wajib untuk Skema AI)

Pemanfaatan fungsional spesifik seperti opsi Ringkas, Jelaskan, serta integrasi dinamis ruang AI Chat sangatlah bergantung pada kunci penghubung API Key aktif dari antarmuka [OpenRouter](https://openrouter.ai/).

1. Klik tombol logo ekstensi ikon **Text Extractor Pro** di *extension bar* Chrome yang bersangkutan.
2. Temukan dan klik logo baut atau ikon gir (Settings ⚙️) di jendela pop up. Tab Options Browser semestinya mulai terbuka.
3. Rekatkan atau masukkan rahasia keamanan **OpenRouter API Key** Anda pada kolom yang disediakan.
4. Tentukan **Model Baseline Standar** (default dianjurkan untuk menembak variasi parameter stabil seperti GPT-4o, Claude 3/3.5, ataupun ekosistem bawaan Google Gemini Pro, bergantung spesifikasi berlangganan akun Anda).
5. Segera verifikasi kredensial tersebut dengan menekan tombol **Test API** demi menghindari galat (Error) kelak di belakang.
6. Anda tidak perlu khawatir, sesi API keamanan pribadi Anda terlindungi baik dalam bentuk data luring yang bersanding otomatis ke infrastruktur lokal `chrome.storage.local`.

---

## 💡 Panduan Penggunaan Ekspres (Quick Start Guide)

1. Berselancarlah mengunjungi link sebuah blog spesifik, artikel harian platform populer, ataupun dokumentasi dengan volume teks yang dinilai raksasa dan melelahkan untuk dibaca.
2. Panggil antarmuka Ekstensi di bilah tugas atas.
3. **Soroti Sumber Ekstraksi Teks:** Pertimbangkan untuk mencentang mode `Article` jika anda beritikad mengecualikan komponen pengganggu bawaan website (*Navigation Menu*, *Share Button Layer*, dll), opsi `Full Page`, atau manfaatkan efisiensi mode *hover pointer interactive* lewat mode `Select`.
4. **Modifikasikan Ekspektasi File Log:** Sesuaikan opsi seting tambahan bila ada keharusan mengeliminir blok link referensi, elemen format perihal gambar, dan penyesuaian spasi ruang *clean whitespace formatting*.
5. Sentuh Trigger Tarik Data atau tombol Execute, kemudian format teks mentah yang Anda impikan bakal segera meresap di panel layar Anda. Disitu fitur andalan **Copy** atau **Download File** (.md, .json) secara *offline* menunggu aksi Anda.
6. **Mulai Eskalasi Perintah AI:** Enggan membuang sisa waktu berharga menatap rentet puluhan paragraf monoton? Sentuh langsung tombol siasat brilian, `⚡ Ringkas` agar kecerdasan AI memungkus dan menampilkan saripati inti sari bahan kajian. Silakan merotasi fungsi tab toggle mutlak **[Original] | [AI Result]** guna membandingkannya seketika.
7. Tidak berhenti sampai di situ, anda dapat merelokasikannya ke dimensi tab fungsional **💬 AI Chat**. Lalu cukup konfirmasikan kejelasan semisal: *"Tolong tuliskan satu argumen krusial penentang di ujung bagian paragraf tulisan ini."* — sekalian saksikan tangkapan presisi sang AI dalam membombardir permohonan logikal dan taktis merujuk materi dasar Anda yang masih utuh terlampir secara gaib di baliknya.

---

## 🐜 Taktik Pemecahan Masalah Sistem Umum (Troubleshooting & Tips)

- **Aktivitas AI Tak Berfungsi / Terkena Delay Fatal (Error):** Anda perlu me-review kebenaran integritas konektivitas *OpenRouter API Key*. Jelajahilah sekilas ke portal Web Dasbor OpenRouter untuk memverifikasi rasio kecukupan rasio kelayakan plafon pembatasan API Kredit di tingkat akun.
- **Tarik Seret Area Dimensi (*Drag Resize Button*) Macet di Ambang Batas Bawah Layar:** Menilik pada filosofi keterbatasan batasan mekanikal Chromium di ruang kotak minimal *pop up*, upaya Anda akan tertahan otomatis di batas bawah bar resolusi komputer. Solusi paling jitu untuk mengakali batas tabir layar panjang: Cukup sentuh dan luncurkan tombol **Popout (Tab Penuh)** di ujung faset kanan elemen kontrol header agar leluasa menggulir kursor pada monitor luas.
- **Kosong Belaka Ketika Menyalakan Perintah Action Ekstrak:** Terdapat probabilitas ekstrem ketika mode dominan prioritas *readability* di kanal konfigurasi eksekusi mode `Article` meleset mengecam titik utama koordinat blok konten teks akibat susunan teknis format kode platform pengembang terlampau rumit atau aneh. Bila Anda mengalami kekosongan tangkapan seperti fenomena di luar akal ini, pindah saja orientasi Anda menyetel model mentah *scrapping* absolut `Full Page`. Selain itu, sejumlah spesifik rekayasa muat SPA yang manipulatif dan eksentrik *(Single Page Application berbasis kerangka library Next.js/React generasi tua)*, ada peluang interupsi jeda proses penyalinan format DOM dari pusat rendering komponennya jika memuat seret. Maka tunggu kelengkapan kesempurnaannya dimuat sempurna, lalu tekan paksa *Re-Extract* pada panel kontrol UI. Coba juga fitur unggulan dinamis mode penyorotan per elemen fungsional presisi bernama `Select`.

---

## 📜 Deklarasi Hak Cipta Kepemilikan (License)

Rilis publik sumber dokumentasi mutlak ini dilepaskan terbuka untuk audiens dalam format payung dan dukungan Lisensi **MIT**. Silakan dengan sepenuh hati dan kebebasan mengotak-atik kodenya, mengeksploitasi pembelajaran modul secara rinci, menyebar salinan repositori dan mendistribusikan penemuan brilian dari basis modifikasi ekstensi sesuai rujukan komersial mutlak legal pada terminologi dokumen bersangkutan yang terlampir. Mempersoalkan kebergantungan krusial pihak komponen skema pihak ketiga (*OpenRouter*) selayaknya merujuk dan memperkuat kesepahaman perjanjian term & kondisi eksternal mandiri sistem pusatnya.
