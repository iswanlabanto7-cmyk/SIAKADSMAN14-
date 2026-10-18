import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// In-Memory Database for SMA Negeri 14 Kota Tidore Kepulauan
let db = {
  settings: {
    schoolName: "SMA Negeri 14 Kota Tidore Kepulauan",
    npsn: "69988123",
    address: "Jl. Lintas Tidore - Sofifi, Kelurahan Guraping, Kec. Oba Utara, Kota Tidore Kepulauan, Maluku Utara",
    principalName: "Drs. H. Abdullah Mahmud, M.Pd.",
    academicYear: "2025/2026",
    semester: "Ganjil"
  },
  users: [
    { id: "1", username: "admin", password: "admin123", name: "Drs. H. Abdullah Mahmud, M.Pd.", nip: "196812151994031005", role: "Admin", email: "kepsek@sman14tidore.sch.id" },
    { id: "2", username: "waka", password: "waka123", name: "Siti Rahma Umar, S.Pd.", nip: "197504202000122001", role: "Admin", email: "waka.kurikulum@sman14tidore.sch.id" },
    { id: "3", username: "budi", password: "guru123", name: "Budi Santoso, S.Pd.", nip: "198205122009021003", role: "Guru/Tendik", email: "budi.santoso@guru.sma.belajar.id", subject: "Matematika" },
    { id: "4", username: "nurul", password: "guru123", name: "Nurul Hidayah, S.Pd.", nip: "198807152014022002", role: "Guru/Tendik", email: "nurul.hidayah@guru.sma.belajar.id", subject: "Bahasa Indonesia" },
    { id: "5", username: "ahmad", password: "guru123", name: "Ahmad Jufri, S.Kom.", nip: "199003212015031004", role: "Guru/Tendik", email: "ahmad.jufri@guru.sma.belajar.id", subject: "Informatika" },
    { id: "6", username: "dewi", password: "guru123", name: "Dewi Lestari, S.Pd.", nip: "199211052019032005", role: "Guru/Tendik", email: "dewi.lestari@guru.sma.belajar.id", subject: "Biologi" }
  ],
  absensi: [
    { id: "a1", date: new Date().toISOString().split('T')[0], userId: "3", name: "Budi Santoso, S.Pd.", status: "Hadir", time: "07:15:20", notes: "Tepat waktu" },
    { id: "a2", date: new Date().toISOString().split('T')[0], userId: "4", name: "Nurul Hidayah, S.Pd.", status: "Hadir", time: "07:20:10", notes: "Tepat waktu" },
    { id: "a3", date: new Date().toISOString().split('T')[0], userId: "5", name: "Ahmad Jufri, S.Kom.", status: "Izin", time: "08:00:00", notes: "Menghadiri Diknas Sofifi" },
    { id: "a4", date: new Date().toISOString().split('T')[0], userId: "6", name: "Dewi Lestari, S.Pd.", status: "Hadir", time: "07:10:45", notes: "Tepat waktu" }
  ],
  jurnal: [
    { id: "j1", date: new Date().toISOString().split('T')[0], userId: "3", name: "Budi Santoso, S.Pd.", subject: "Matematika", classRoom: "XII IPA 1", material: "Turunan Fungsi Aljabar", notes: "Siswa aktif mengerjakan latihan soal di papan tulis.", timestamp: "09:30:00" },
    { id: "j2", date: new Date().toISOString().split('T')[0], userId: "4", name: "Nurul Hidayah, S.Pd.", subject: "Bahasa Indonesia", classRoom: "XI IPS 2", material: "Teks Editorial & Opini", notes: "Diskusi kelompok mengenai isu sosial daerah.", timestamp: "10:15:00" },
    { id: "j3", date: new Date().toISOString().split('T')[0], userId: "5", name: "Ahmad Jufri, S.Kom.", subject: "Informatika", classRoom: "X MIPA", material: "Algoritma Pemrograman Dasar", notes: "Praktikum dasar Python menggunakan web compiler.", timestamp: "11:00:00" }
  ],
  dokumen: [
    { id: "d1", userId: "3", name: "Budi Santoso, S.Pd.", title: "Modul Ajar Matematika Turunan XII", category: "Modul Ajar", fileUrl: "https://docs.google.com/document/d/sample1/edit", fileName: "modul_matematika_XII.pdf", uploadDate: "2025-07-15", status: "Disetujui" },
    { id: "d2", userId: "4", name: "Nurul Hidayah, S.Pd.", title: "RPP Bahasa Indonesia Teks Editorial", category: "RPP", fileUrl: "https://docs.google.com/document/d/sample2/edit", fileName: "rpp_indo_editorial.docx", uploadDate: "2025-07-18", status: "Disetujui" },
    { id: "d3", userId: "5", name: "Ahmad Jufri, S.Kom.", title: "Silabus Informatika Kelas X", category: "Silabus", fileUrl: "https://docs.google.com/document/d/sample3/edit", fileName: "silabus_inf_x.pdf", uploadDate: "2025-07-20", status: "Menunggu" }
  ],
  supervisi: [
    { id: "s1", userId: "3", teacherName: "Budi Santoso, S.Pd.", supervisor: "Drs. H. Abdullah Mahmud, M.Pd.", date: "2025-09-10", pedagogicalScore: 88, professionalScore: 90, socialScore: 85, personalityScore: 92, averageScore: 88.7, notes: "Pembelajaran interaktif, metode problem solving sudah sangat baik. Pertahankan." },
    { id: "s2", userId: "4", teacherName: "Nurul Hidayah, S.Pd.", supervisor: "Siti Rahma Umar, S.Pd.", date: "2025-09-12", pedagogicalScore: 85, professionalScore: 88, socialScore: 90, personalityScore: 89, averageScore: 88.0, notes: "Media pembelajaran visual sangat menarik. Tingkatkan variasi tanya jawab aktif." }
  ]
};

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Username atau password salah.' });
  }
});

app.get('/api/users', (req, res) => {
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const newUser = { id: Date.now().toString(), ...req.body };
  db.users.push(newUser);
  res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.users = db.users.filter(u => u.id !== id);
  res.json({ success: true });
});

app.get('/api/absensi', (req, res) => {
  res.json(db.absensi);
});

app.post('/api/absensi', (req, res) => {
  const record = { id: 'a_' + Date.now(), date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().split(' ')[0], ...req.body };
  db.absensi.unshift(record);
  res.json({ success: true, record });
});

app.get('/api/jurnal', (req, res) => {
  res.json(db.jurnal);
});

app.post('/api/jurnal', (req, res) => {
  const record = { id: 'j_' + Date.now(), date: new Date().toISOString().split('T')[0], timestamp: new Date().toTimeString().split(' ')[0], ...req.body };
  db.jurnal.unshift(record);
  res.json({ success: true, record });
});

app.get('/api/dokumen', (req, res) => {
  res.json(db.dokumen);
});

app.post('/api/dokumen', (req, res) => {
  const record = { id: 'd_' + Date.now(), uploadDate: new Date().toISOString().split('T')[0], status: 'Menunggu', ...req.body };
  db.dokumen.unshift(record);
  res.json({ success: true, record });
});

app.put('/api/dokumen/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const doc = db.dokumen.find(d => d.id === id);
  if (doc) {
    doc.status = status;
    res.json({ success: true, doc });
  } else {
    res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
  }
});

app.get('/api/supervisi', (req, res) => {
  res.json(db.supervisi);
});

app.post('/api/supervisi', (req, res) => {
  const { pedagogicalScore, professionalScore, socialScore, personalityScore } = req.body;
  const avg = (Number(pedagogicalScore) + Number(professionalScore) + Number(socialScore) + Number(personalityScore)) / 4;
  const record = { id: 's_' + Date.now(), averageScore: Number(avg.toFixed(1)), ...req.body };
  db.supervisi.unshift(record);
  res.json({ success: true, record });
});

app.get('/api/settings', (req, res) => {
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  res.json({ success: true, settings: db.settings });
});

// Google Apps Script & Sheets code generator endpoint
app.get('/api/gas-code', (req, res) => {
  const gasCode = `/**
 * Google Apps Script (Code.gs) untuk SIAKAD SMA Negeri 14 Kota Tidore Kepulauan
 * Backend Google Sheets & Google Drive Storage
 */

const SS_ID = "YOUR_GOOGLE_SHEET_ID_HERE";

function doGet(e) {
  const action = e.parameter.action || "index";
  if (action === "getUsers") return sendJSON(getData("Users"));
  if (action === "getAbsensi") return sendJSON(getData("Absensi"));
  if (action === "getJurnal") return sendJSON(getData("Jurnal"));
  if (action === "getDokumen") return sendJSON(getData("Dokumen"));
  if (action === "getSupervisi") return sendJSON(getData("Supervisi"));
  
  return ContentService.createTextOutput("SIAKAD SMA N 14 Tidore Kepulauan Backend API Active");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === "login") {
      return handleLogin(data.username, data.password);
    } else if (action === "saveAbsensi") {
      return appendRow("Absensi", [new Date(), data.userId, data.name, data.status, data.time, data.notes]);
    } else if (action === "saveJurnal") {
      return appendRow("Jurnal", [new Date(), data.userId, data.name, data.subject, data.classRoom, data.material, data.notes]);
    } else if (action === "uploadDokumen") {
      // Handle Base64 file upload to Google Drive
      const folderId = "YOUR_DRIVE_FOLDER_ID_HERE";
      const fileBlob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType, data.fileName);
      const folder = DriveApp.getFolderById(folderId);
      const file = folder.createFile(fileBlob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const fileUrl = file.getUrl();
      
      appendRow("Dokumen", [new Date(), data.userId, data.name, data.title, data.category, fileUrl, data.fileName, "Menunggu"]);
      return sendJSON({ success: true, fileUrl });
    }
    
    return sendJSON({ success: false, message: "Aksi tidak dikenali" });
  } catch (err) {
    return sendJSON({ success: false, error: err.toString() });
  }
}

function getData(sheetName) {
  const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendRow(sheetName, values) {
  const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(sheetName);
  sheet.appendRow(values);
  return sendJSON({ success: true });
}

function handleLogin(username, password) {
  const users = getData("Users");
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    return sendJSON({ success: true, user });
  }
  return sendJSON({ success: false, message: "Username atau password salah" });
}

function sendJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

  const sheetStructures = [
    { name: "Users", columns: ["id", "username", "password", "name", "nip", "role", "email", "subject"] },
    { name: "Absensi", columns: ["id", "date", "userId", "name", "status", "time", "notes"] },
    { name: "Jurnal", columns: ["id", "date", "userId", "name", "subject", "classRoom", "material", "notes", "timestamp"] },
    { name: "Dokumen", columns: ["id", "userId", "name", "title", "category", "fileUrl", "fileName", "uploadDate", "status"] },
    { name: "Supervisi", columns: ["id", "userId", "teacherName", "supervisor", "date", "pedagogicalScore", "professionalScore", "socialScore", "personalityScore", "averageScore", "notes"] }
  ];

  res.json({ gasCode, sheetStructures });
});

// Gemini AI endpoints
app.post('/api/gemini/generate-rpp', async (req, res) => {
  try {
    const { subject, grade, topic, objective } = req.body;
    const prompt = `Bertindaklah sebagai Kurikulum Merdeka Expert. Buatkan Modul Ajar / Rencana Pelaksanaan Pembelajaran (RPP) yang profesional dan ringkas untuk mata pelajaran ${subject} kelas ${grade} dengan topik "${topic}" dan tujuan pembelajaran "${objective}". 
    Format dengan struktur markdown rapi:
    1. Identitas Modul (Mata Pelajaran, Kelas, Alokasi Waktu)
    2. Tujuan Pembelajaran
    3. Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)
    4. Asesmen / Penilaian Pembelajaran
    Sekolah: SMA Negeri 14 Kota Tidore Kepulauan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ success: true, result: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal menghasilkan RPP dengan Gemini AI' });
  }
});

app.post('/api/gemini/supervisor-feedback', async (req, res) => {
  try {
    const { teacherName, subject, scores, notes } = req.body;
    const prompt = `Berikan catatan saran pembinaan profesional yang membangun dan suportif untuk Guru ${teacherName} (${subject}) yang baru disupervisi di SMA Negeri 14 Kota Tidore Kepulauan.
    Skor Penilaian: Pedagogik: ${scores.pedagogical}, Profesional: ${scores.professional}, Sosial: ${scores.social}, Kepribadian: ${scores.personality}.
    Catatan pengamat: "${notes}".
    Tuliskan dalam format paragraf reflektif yang memotivasi dan memberi 3 rekomendasi peningkatan mutu pembelajaran Kurikulum Merdeka.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ success: true, feedback: response.text });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal menghasilkan feedback AI' });
  }
});

// Vite middleware for development
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: false }
});
app.use(vite.middlewares);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SIAKAD SMA N 14 Tidore Kepulauan running on http://localhost:${PORT}`);
});
