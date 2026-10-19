import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const app = express();
app.use(express.json({ limit: '10mb' }));

// Enable CORS for Vercel and cross-origin environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'Admin' | 'Guru/Tendik';
  action: string;
  category: 'AUTH' | 'DOKUMEN' | 'ABSENSI' | 'JURNAL' | 'SUPERVISI' | 'SISTEM';
  description: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details?: Record<string, any>;
}

// In-Memory Database for SMA Negeri 14 Kota Tidore Kepulauan
export const db: {
  settings: any;
  users: any[];
  absensi: any[];
  jurnal: any[];
  dokumen: any[];
  supervisi: any[];
  auditLogs: AuditLogItem[];
} = {
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
    { id: "d1", userId: "3", name: "Budi Santoso, S.Pd.", title: "Modul Ajar Matematika: Diferensial & Turunan Aljabar", category: "Modul Ajar", fileUrl: "https://docs.google.com/document/d/sample1/edit", fileName: "Modul_Ajar_Matematika_Fase_F.pdf", uploadDate: "2025-07-15", status: "Disetujui", fileSize: "1.4 MB", notes: "Sistematika asesmen formatif dan rubrik penilaian sudah sangat lengkap." },
    { id: "d2", userId: "3", name: "Budi Santoso, S.Pd.", title: "ATP Matematika Fase F (Kelas XI & XII)", category: "ATP", fileUrl: "https://docs.google.com/document/d/sample2/edit", fileName: "ATP_Matematika_Fase_F_SMA14.pdf", uploadDate: "2025-07-12", status: "Disetujui", fileSize: "820 KB", notes: "Alur Tujuan Pembelajaran runtut sesuai Capaian Pembelajaran BSKAP." },
    { id: "d3", userId: "3", name: "Budi Santoso, S.Pd.", title: "Program Tahunan (PROTA) Matematika 2025/2026", category: "PROTA", fileUrl: "https://docs.google.com/document/d/sample3/edit", fileName: "PROTA_Matematika_2025_2026.docx", uploadDate: "2025-07-10", status: "Disetujui", fileSize: "450 KB", notes: "Alokasi jam efektif semester ganjil dan genap sesuai kalender pendidikan." },
    { id: "d4", userId: "3", name: "Budi Santoso, S.Pd.", title: "Program Semester (PROSEM) Ganjil Matematika XII", category: "PROSEM", fileUrl: "https://docs.google.com/document/d/sample4/edit", fileName: "PROSEM_Ganjil_Matematika_XII.xlsx", uploadDate: "2025-07-11", status: "Disetujui", fileSize: "510 KB", notes: "Matriks distribusi mingguan sudah disesuaikan dengan PTS & PAS." },
    { id: "d5", userId: "4", name: "Nurul Hidayah, S.Pd.", title: "Modul Ajar Bahasa Indonesia: Menulis Opini dan Editorial", category: "Modul Ajar", fileUrl: "https://docs.google.com/document/d/sample5/edit", fileName: "Modul_Ajar_Bahasa_Indonesia_XI.pdf", uploadDate: "2025-07-18", status: "Disetujui", fileSize: "2.1 MB", notes: "Lembar kerja peserta didik (LKPD) berbasis kontekstual daerah Maluku Utara." },
    { id: "d6", userId: "4", name: "Nurul Hidayah, S.Pd.", title: "ATP Bahasa Indonesia Fase F SMA", category: "ATP", fileUrl: "https://docs.google.com/document/d/sample6/edit", fileName: "ATP_Bahasa_Indonesia_Fase_F.pdf", uploadDate: "2025-07-14", status: "Disetujui", fileSize: "780 KB", notes: "Elemen Menyimak, Membaca, dan Menulis terintegrasi dengan baik." },
    { id: "d7", userId: "4", name: "Nurul Hidayah, S.Pd.", title: "PROTA Bahasa Indonesia Kelas XI", category: "PROTA", fileUrl: "https://docs.google.com/document/d/sample7/edit", fileName: "PROTA_Bahasa_Indonesia_XI.pdf", uploadDate: "2025-07-16", status: "Disetujui", fileSize: "390 KB", notes: "Pembagian jam per tema sesuai acuan kurikulum." },
    { id: "d8", userId: "4", name: "Nurul Hidayah, S.Pd.", title: "PROSEM Semester Ganjil Bahasa Indonesia", category: "PROSEM", fileUrl: "https://docs.google.com/document/d/sample8/edit", fileName: "PROSEM_Ganjil_Bahasa_Indonesia.xlsx", uploadDate: "2025-07-16", status: "Menunggu", fileSize: "420 KB", notes: "Menunggu penelaahan supervisor terkait alokasi pekan jeda." },
    { id: "d9", userId: "5", name: "Ahmad Jufri, S.Kom.", title: "ATP Informatika Fase E (Kelas X)", category: "ATP", fileUrl: "https://docs.google.com/document/d/sample9/edit", fileName: "ATP_Informatika_Kelas_X.pdf", uploadDate: "2025-07-20", status: "Menunggu", fileSize: "650 KB", notes: "Perlu konfirmasi capaian berpikir komputasional." },
    { id: "d10", userId: "5", name: "Ahmad Jufri, S.Kom.", title: "Modul Ajar Informatika: Algoritma & Pemrograman Python Dasar", category: "Modul Ajar", fileUrl: "https://docs.google.com/document/d/sample10/edit", fileName: "Modul_Informatika_Python_X.pdf", uploadDate: "2025-07-22", status: "Menunggu", fileSize: "1.8 MB", notes: "Materi praktikum laboratorium komputer." },
    { id: "d11", userId: "5", name: "Ahmad Jufri, S.Kom.", title: "PROTA Informatika Kelas X Tahun 2025/2026", category: "PROTA", fileUrl: "https://docs.google.com/document/d/sample11/edit", fileName: "PROTA_Informatika_2025.docx", uploadDate: "2025-07-21", status: "Revisi", fileSize: "340 KB", notes: "Harap sesuaikan pembagian jam untuk praktikum jaringan." },
    { id: "d12", userId: "5", name: "Ahmad Jufri, S.Kom.", title: "PROSEM Informatika Semester Ganjil", category: "PROSEM", fileUrl: "https://docs.google.com/document/d/sample12/edit", fileName: "PROSEM_Informatika_Ganjil.xlsx", uploadDate: "2025-07-21", status: "Menunggu", fileSize: "490 KB", notes: "Pekan penilaian sumatif belum sinkron dengan kalender sekolah." },
    { id: "d13", userId: "6", name: "Dewi Lestari, S.Pd.", title: "ATP Biologi Fase F SMA", category: "ATP", fileUrl: "https://docs.google.com/document/d/sample13/edit", fileName: "ATP_Biologi_Fase_F.pdf", uploadDate: "2025-07-23", status: "Disetujui", fileSize: "890 KB", notes: "Peta konsep bioteknologi dan keanekaragaman hayati Maluku Utara mantap." },
    { id: "d14", userId: "6", name: "Dewi Lestari, S.Pd.", title: "PROTA Biologi Kelas XI", category: "PROTA", fileUrl: "https://docs.google.com/document/d/sample14/edit", fileName: "PROTA_Biologi_XI.docx", uploadDate: "2025-07-23", status: "Disetujui", fileSize: "410 KB", notes: "Alokasi jam teori dan praktikum seimbang." },
    { id: "d15", userId: "6", name: "Dewi Lestari, S.Pd.", title: "PROSEM Ganjil Biologi Kelas XI", category: "PROSEM", fileUrl: "https://docs.google.com/document/d/sample15/edit", fileName: "PROSEM_Biologi_Ganjil_XI.xlsx", uploadDate: "2025-07-24", status: "Disetujui", fileSize: "460 KB", notes: "Jadwal praktikum mikroskop sudah terplot." },
    { id: "d16", userId: "6", name: "Dewi Lestari, S.Pd.", title: "Modul Ajar Biologi: Struktur Sel & Transpor Membran", category: "Modul Ajar", fileUrl: "https://docs.google.com/document/d/sample16/edit", fileName: "Modul_Biologi_Sel_XI.pdf", uploadDate: "2025-07-25", status: "Disetujui", fileSize: "2.4 MB", notes: "LKPD pengamatan sel bawang merah dan gabus sangat aplikatif." }
  ],
  supervisi: [
    { id: "s1", userId: "3", teacherName: "Budi Santoso, S.Pd.", supervisor: "Drs. H. Abdullah Mahmud, M.Pd.", date: "2025-09-10", pedagogicalScore: 88, professionalScore: 90, socialScore: 85, personalityScore: 92, averageScore: 88.7, notes: "Perangkat ajar (ATP, PROTA, PROSEM, Modul Ajar) sangat tertib dan lengkap. Pembelajaran berdiferensiasi terlaksana sangat baik." },
    { id: "s2", userId: "4", teacherName: "Nurul Hidayah, S.Pd.", supervisor: "Siti Rahma Umar, S.Pd.", date: "2025-09-12", pedagogicalScore: 85, professionalScore: 88, socialScore: 90, personalityScore: 89, averageScore: 88.0, notes: "Media pembelajaran visual menarik. ATP dan Modul Ajar selaras dengan capaian Kurikulum Merdeka." }
  ],
  auditLogs: [
    {
      id: "log_1",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      userId: "1",
      userName: "Drs. H. Abdullah Mahmud, M.Pd.",
      userRole: "Admin",
      action: "LOGIN_SUCCESS",
      category: "AUTH",
      description: "Admin Kepala Sekolah berhasil login ke sistem SIAKAD",
      ipAddress: "180.252.88.14 (Kota Tidore)",
      status: "SUCCESS"
    },
    {
      id: "log_2",
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      userId: "3",
      userName: "Budi Santoso, S.Pd.",
      userRole: "Guru/Tendik",
      action: "DOKUMEN_UPLOAD",
      category: "DOKUMEN",
      description: "Mengunggah dokumen Modul Ajar: 'Diferensial & Turunan Aljabar' (1.4 MB)",
      ipAddress: "182.1.205.42 (Oba Utara)",
      status: "SUCCESS",
      details: { category: "Modul Ajar", fileName: "Modul_Ajar_Matematika_Fase_F.pdf" }
    },
    {
      id: "log_3",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      userId: "1",
      userName: "Drs. H. Abdullah Mahmud, M.Pd.",
      userRole: "Admin",
      action: "DOKUMEN_VERIFIED",
      category: "SUPERVISI",
      description: "Menyetujui dokumen ATP Matematika Fase F milik Budi Santoso, S.Pd.",
      ipAddress: "180.252.88.14 (Kota Tidore)",
      status: "SUCCESS",
      details: { status: "Disetujui", targetDoc: "ATP_Matematika_Fase_F_SMA14.pdf" }
    },
    {
      id: "log_4",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      userId: "4",
      userName: "Nurul Hidayah, S.Pd.",
      userRole: "Guru/Tendik",
      action: "ABSENSI_SUBMIT",
      category: "ABSENSI",
      description: "Mencatatkan presensi harian: Hadir (Tepat waktu)",
      ipAddress: "182.1.205.88 (Sofifi)",
      status: "SUCCESS",
      details: { status: "Hadir", time: "07:20:10" }
    },
    {
      id: "log_5",
      timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
      userId: "3",
      userName: "Budi Santoso, S.Pd.",
      userRole: "Guru/Tendik",
      action: "JURNAL_SUBMIT",
      category: "JURNAL",
      description: "Mengisi jurnal mengajar Matematika XII IPA 1 materi 'Turunan Fungsi Aljabar'",
      ipAddress: "182.1.205.42 (Oba Utara)",
      status: "SUCCESS"
    },
    {
      id: "log_6",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      userId: "unknown",
      userName: "guest_attempt",
      userRole: "Guru/Tendik",
      action: "LOGIN_FAILED",
      category: "AUTH",
      description: "Percobaan login gagal dengan username 'guru_demo' (Kredensial tidak cocok)",
      ipAddress: "36.88.12.91 (Maluku Utara)",
      status: "FAILED"
    },
    {
      id: "log_7",
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      userId: "1",
      userName: "Drs. H. Abdullah Mahmud, M.Pd.",
      userRole: "Admin",
      action: "SUPERVISI_EVALUASI",
      category: "SUPERVISI",
      description: "Menyelesaikan penilaian supervisi tatap muka untuk Budi Santoso, S.Pd. (Skor: 88.7)",
      ipAddress: "180.252.88.14 (Kota Tidore)",
      status: "SUCCESS"
    }
  ]
};

// Audit Trail Helper
export function logAudit(
  action: string,
  category: 'AUTH' | 'DOKUMEN' | 'ABSENSI' | 'JURNAL' | 'SUPERVISI' | 'SISTEM',
  userId: string,
  userName: string,
  userRole: 'Admin' | 'Guru/Tendik',
  description: string,
  status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS',
  ipAddress: string = '180.252.88.14 (Kota Tidore)',
  details?: Record<string, any>
) {
  const newLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    userId: userId || 'system',
    userName: userName || 'Sistem',
    userRole: userRole || 'Guru/Tendik',
    action,
    category,
    description,
    ipAddress,
    status,
    details
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
  return newLog;
}

// Health check / status API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'SIAKAD SMA Negeri 14 Kota Tidore Kepulauan',
    timestamp: new Date().toISOString(),
    version: '1.2.0'
  });
});

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    logAudit(
      'LOGIN_SUCCESS',
      'AUTH',
      user.id,
      user.name,
      user.role,
      `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem`,
      'SUCCESS',
      '180.252.88.14 (Kota Tidore)',
      { username }
    );
    res.json({ success: true, user });
  } else {
    logAudit(
      'LOGIN_FAILED',
      'AUTH',
      'guest',
      username || 'Anonim',
      'Guru/Tendik',
      `Percobaan login gagal dengan username: "${username}"`,
      'FAILED',
      '36.88.12.91 (Maluku Utara)',
      { attemptedUsername: username }
    );
    res.status(401).json({ success: false, message: 'Username atau password salah.' });
  }
});

// Audit Trail API Endpoints
app.get('/api/audit-trail', (_req, res) => {
  res.json(db.auditLogs);
});

app.post('/api/audit-trail', (req, res) => {
  const { action, category, userId, userName, userRole, description, status, ipAddress, details } = req.body;
  const newLog = logAudit(
    action || 'ACTIVITY',
    category || 'SISTEM',
    userId,
    userName,
    userRole,
    description || 'Aktivitas sistem',
    status || 'SUCCESS',
    ipAddress,
    details
  );
  res.json({ success: true, log: newLog });
});

app.delete('/api/audit-trail', (_req, res) => {
  db.auditLogs = [];
  res.json({ success: true, message: 'Log audit aktivitas berhasil dikosongkan.' });
});

app.get('/api/users', (_req, res) => {
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const newUser = { id: Date.now().toString(), ...req.body };
  db.users.push(newUser);
  logAudit(
    'USER_CREATE',
    'SISTEM',
    '1',
    'Admin Kepala Sekolah',
    'Admin',
    `Menambahkan pengguna baru: ${newUser.name} (${newUser.role}) - NIP: ${newUser.nip || '-'}`,
    'SUCCESS',
    '180.252.88.14 (Kota Tidore)',
    { newUserId: newUser.id, username: newUser.username }
  );
  res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    logAudit(
      'USER_UPDATE',
      'SISTEM',
      '1',
      'Admin Kepala Sekolah',
      'Admin',
      `Memperbarui data pengguna: ${db.users[index].name} (${db.users[index].role})`,
      'SUCCESS',
      '180.252.88.14 (Kota Tidore)',
      { targetUserId: id }
    );
    res.json({ success: true, user: db.users[index] });
  } else {
    res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const targetUser = db.users.find(u => u.id === id);
  db.users = db.users.filter(u => u.id !== id);
  logAudit(
    'USER_DELETE',
    'SISTEM',
    '1',
    'Admin Kepala Sekolah',
    'Admin',
    `Menghapus akun pengguna: ${targetUser ? targetUser.name : id}`,
    'WARNING',
    '180.252.88.14 (Kota Tidore)',
    { deletedUserId: id }
  );
  res.json({ success: true });
});

app.get('/api/absensi', (_req, res) => {
  res.json(db.absensi);
});

app.post('/api/absensi', (req, res) => {
  const newAbsen = { id: 'a_' + Date.now(), ...req.body };
  db.absensi.unshift(newAbsen);
  logAudit(
    'ABSENSI_SUBMIT',
    'ABSENSI',
    newAbsen.userId,
    newAbsen.name,
    'Guru/Tendik',
    `Pencatatan presensi harian guru: ${newAbsen.status} (Waktu: ${newAbsen.time || '-'})`,
    'SUCCESS',
    '182.1.205.42 (Oba Utara)',
    { status: newAbsen.status, notes: newAbsen.notes }
  );
  res.json({ success: true, absen: newAbsen });
});

app.get('/api/jurnal', (_req, res) => {
  res.json(db.jurnal);
});

app.post('/api/jurnal', (req, res) => {
  const newJurnal = { id: 'j_' + Date.now(), ...req.body };
  db.jurnal.unshift(newJurnal);
  logAudit(
    'JURNAL_SUBMIT',
    'JURNAL',
    newJurnal.userId,
    newJurnal.name,
    'Guru/Tendik',
    `Pengisian jurnal mengajar ${newJurnal.subject} di kelas ${newJurnal.classRoom}: materi '${newJurnal.material}'`,
    'SUCCESS',
    '182.1.205.42 (Oba Utara)',
    { subject: newJurnal.subject, classRoom: newJurnal.classRoom }
  );
  res.json({ success: true, jurnal: newJurnal });
});

app.get('/api/dokumen', (_req, res) => {
  res.json(db.dokumen);
});

app.post('/api/dokumen', (req, res) => {
  const newDoc = { id: 'd_' + Date.now(), ...req.body };
  db.dokumen.unshift(newDoc);
  logAudit(
    'DOKUMEN_UPLOAD',
    'DOKUMEN',
    newDoc.userId,
    newDoc.name,
    'Guru/Tendik',
    `Mengunggah berkas administrasi ${newDoc.category}: '${newDoc.title}' (${newDoc.fileName || 'file'})`,
    'SUCCESS',
    '182.1.205.42 (Oba Utara)',
    { category: newDoc.category, title: newDoc.title, fileName: newDoc.fileName }
  );
  res.json({ success: true, doc: newDoc });
});

app.put('/api/dokumen/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const doc = db.dokumen.find(d => d.id === id);
  if (doc) {
    if (status) doc.status = status;
    if (notes !== undefined) doc.notes = notes;
    logAudit(
      'DOKUMEN_VERIFIED',
      'SUPERVISI',
      '1',
      'Admin Kepala Sekolah',
      'Admin',
      `Telaah dokumen ${doc.category} milik ${doc.name} diubah menjadi '${status}'`,
      status === 'Disetujui' ? 'SUCCESS' : status === 'Revisi' ? 'WARNING' : 'SUCCESS',
      '180.252.88.14 (Kota Tidore)',
      { docId: id, category: doc.category, newStatus: status, notes }
    );
    res.json({ success: true, doc });
  } else {
    res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
  }
});

app.get('/api/supervisi', (_req, res) => {
  res.json(db.supervisi);
});

app.post('/api/supervisi', (req, res) => {
  const newSup = { id: 's_' + Date.now(), ...req.body };
  db.supervisi.unshift(newSup);
  logAudit(
    'SUPERVISI_EVALUASI',
    'SUPERVISI',
    '1',
    newSup.supervisor || 'Admin Kepala Sekolah',
    'Admin',
    `Menyimpan hasil supervisi tatap muka untuk guru ${newSup.teacherName} (Rata-rata: ${newSup.averageScore})`,
    'SUCCESS',
    '180.252.88.14 (Kota Tidore)',
    { teacherName: newSup.teacherName, avgScore: newSup.averageScore }
  );
  res.json({ success: true, supervisi: newSup });
});

app.get('/api/settings', (_req, res) => {
  res.json(db.settings);
});

app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  logAudit(
    'SETTING_UPDATE',
    'SISTEM',
    '1',
    'Admin Kepala Sekolah',
    'Admin',
    `Memperbarui identitas dan pengaturan sekolah (${db.settings.schoolName})`,
    'SUCCESS',
    '180.252.88.14 (Kota Tidore)',
    { academicYear: db.settings.academicYear }
  );
  res.json({ success: true, settings: db.settings });
});

// Gemini AI endpoints
app.post('/api/gemini/generate-rpp', async (req, res) => {
  const { subject, grade, topic, objective } = req.body;
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("No API Key configured");
    }
    const prompt = `Bertindaklah sebagai Kurikulum Merdeka Expert. Buatkan Modul Ajar / Rencana Pelaksanaan Pembelajaran (RPP) yang lengkap, mendalam, dan aplikatif untuk SMA Negeri 14 Kota Tidore Kepulauan:
Mata Pelajaran: ${subject}
Fase/Kelas: ${grade}
Topik/Materi: ${topic}
Tujuan Pembelajaran: ${objective}

Sistematika harus mencakup:
1. Informasi Umum & Profil Pelajar Pancasila (fokus: Bernalar Kritis, Gotong Royong, Mandiri).
2. Capaian Pembelajaran & Alur Tujuan Pembelajaran (ATP).
3. Rancangan Pembelajaran Berdiferensiasi (Diferensiasi Konten, Proses, dan Produk) dengan kearifan lokal Tidore Kepulauan & Maluku Utara.
4. Rencana Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup).
5. Asesmen Diagnostik, Formatif, dan Sumatif lengkap dengan rubrik.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    logAudit(
      'AI_GENERATE_RPP',
      'DOKUMEN',
      'system',
      'Guru / AI Asisten',
      'Guru/Tendik',
      `Menghasilkan draf Modul Ajar Kurikulum Merdeka mapel ${subject} topik '${topic}' menggunakan Gemini AI`,
      'SUCCESS'
    );

    res.json({ success: true, result: response.text });
  } catch (err: any) {
    const fallbackRPP = `### MODUL AJAR KURIKULUM MERDEKA
**Satuan Pendidikan**: SMA Negeri 14 Kota Tidore Kepulauan  
**Mata Pelajaran**: ${subject || 'Matematika'}  
**Fase / Kelas**: ${grade || 'Fase F / Kelas XII'}  
**Materi Pokok**: ${topic || 'Pengembangan Konsep Berdiferensiasi'}  
**Alokasi Waktu**: 2 JP (2 x 45 Menit)  
**Tahun Ajaran**: 2025/2026 (Semester Ganjil)  

---

#### 1. Tujuan Pembelajaran (Berdasarkan ATP)
- ${objective || `Peserta didik mampu memahami dan mengaplikasikan konsep ${topic} dalam memecahkan permasalahan nyata dengan pendekatan saintifik.`}
- Mengembangkan Profil Pelajar Pancasila: Bernalar Kritis, Gotong Royong, dan Mandiri.

#### 2. Kegiatan Pembelajaran Berdiferensiasi
- **Pendahuluan (15 Menit)**:
  1. Guru membuka pembelajaran dengan salam khas Maluku Utara dan berdoa bersama.
  2. Guru mengecek kesiapan fisik dan psikologis siswa serta mengaitkan apersepsi kearifan lokal Tidore Kepulauan.
  3. Menyampaikan tujuan dan alur kegiatan pembelajaran.
- **Kegiatan Inti (60 Menit)**:
  1. *Eksplorasi Konsep*: Siswa dibagi dalam kelompok heterogen untuk mengamati tayangan materi tentang "${topic}".
  2. *Diskusi Terbimbing*: Guru memberikan Lembar Kerja Peserta Didik (LKPD) kontekstual.
  3. *Presentasi*: Perwakilan kelompok memaparkan hasil telaah dan saling memberikan umpan balik (peer feedback).
- **Penutup (15 Menit)**:
  1. Refleksi bersama terhadap poin-poin penting yang telah dipelajari.
  2. Guru memberikan apresiasi dan tindak lanjut penugasan mandiri.
  3. Doa penutup dan salam.

#### 3. Asesmen Pembelajaran
- **Asesmen Formatif**: Pengamatan sikap keaktifan saat diskusi kelompok dan rubrik ceklis lembar kerja.
- **Asesmen Sumatif**: Tes tertulis singkat pemahaman konsep materi ${topic}.`;

    res.json({ success: true, result: fallbackRPP });
  }
});

app.post('/api/gemini/supervisor-feedback', async (req, res) => {
  const { teacherName, subject, scores, notes } = req.body;
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("No API Key configured");
    }
    const prompt = `Berikan catatan saran pembinaan profesional yang membangun dan suportif untuk Guru ${teacherName} (${subject}) yang baru disupervisi di SMA Negeri 14 Kota Tidore Kepulauan.
    Skor Penilaian: Pedagogik: ${scores.pedagogical}, Profesional: ${scores.professional}, Sosial: ${scores.social}, Kepribadian: ${scores.personality}.
    Catatan pengamat: "${notes}".
    Tuliskan dalam format paragraf reflektif yang memotivasi dan memberi 3 rekomendasi peningkatan mutu pembelajaran Kurikulum Merdeka.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    logAudit(
      'AI_SUPERVISOR_FEEDBACK',
      'SUPERVISI',
      '1',
      'Admin Kepala Sekolah',
      'Admin',
      `Menghasilkan rekomendasi pembinaan AI untuk guru ${teacherName}`,
      'SUCCESS'
    );

    res.json({ success: true, feedback: response.text });
  } catch (err: any) {
    const avgScore = ((Number(scores?.pedagogical || 85) + Number(scores?.professional || 85) + Number(scores?.social || 85) + Number(scores?.personality || 85)) / 4).toFixed(1);
    const fallbackFeedback = `**Catatan Pembinaan Supervisi Akademik - Kepala Sekolah / Waka Kurikulum**
Yth. Bapak/Ibu **${teacherName}** (${subject}),
Berdasarkan hasil supervisi pembelajaran dan telaah perangkat ajar (ATP, PROTA, PROSEM, dan Modul Ajar) dengan skor rata-rata **${avgScore}** (Kategori: Amat Baik):

1. **Apresiasi Pelaksanaan KBM**:
   Proses pembelajaran di kelas sudah sangat terstruktur, interaktif, dan mencerminkan komitmen tinggi terhadap kemajuan belajar peserta didik di SMA Negeri 14 Kota Tidore Kepulauan. Sikap keteladanan dan interaksi sosial yang hangat menciptakan suasana belajar yang kondusif. Catatan lapangan: "${notes || 'KBM berlangsung kondusif dan aktif.'}"

2. **Tiga Rekomendasi Peningkatan Mutu**:
   - **Sinkronisasi ATP & Modul Ajar**: Pastikan setiap tahapan pembelajaran berdiferensiasi pada modul ajar mencantumkan ragam asesmen formatif awal (diagnostik) untuk memetakan kesiapan peserta didik.
   - **Pemanfaatan Konteks Lokal Tidore**: Perkuat integrasi kontekstual bahari, sejarah, dan potensi lingkungan Maluku Utara dalam studi kasus atau proyek pembelajaran.
   - **Refleksi Berkelanjutan**: Terus dokumentasikan umpan balik peserta didik di akhir semester sebagai bahan penyempurnaan PROSEM dan program tindak lanjut supervisi.

*Tetap semangat dalam mengabdi dan mencerdaskan putra-putri Tidore Kepulauan!*`;

    res.json({ success: true, feedback: fallbackFeedback });
  }
});
