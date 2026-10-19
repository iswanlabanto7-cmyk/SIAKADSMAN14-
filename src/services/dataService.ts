import { User, AbsensiRecord, JournalRecord, DocumentRecord, SupervisionRecord, SchoolSettings, AuditLog } from '../types';

// Default initial data for SMA Negeri 14 Kota Tidore Kepulauan
export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: "SMA Negeri 14 Kota Tidore Kepulauan",
  npsn: "69988123",
  address: "Jl. Lintas Tidore - Sofifi, Kelurahan Guraping, Kec. Oba Utara, Kota Tidore Kepulauan, Maluku Utara",
  principalName: "Drs. H. Abdullah Mahmud, M.Pd.",
  academicYear: "2025/2026",
  semester: "Ganjil"
};

export const DEFAULT_USERS: User[] = [
  { id: "1", username: "admin", password: "admin123", name: "Drs. H. Abdullah Mahmud, M.Pd.", nip: "196812151994031005", role: "Admin", email: "kepsek@sman14tidore.sch.id" },
  { id: "2", username: "waka", password: "waka123", name: "Siti Rahma Umar, S.Pd.", nip: "197504202000122001", role: "Admin", email: "waka.kurikulum@sman14tidore.sch.id" },
  { id: "3", username: "budi", password: "guru123", name: "Budi Santoso, S.Pd.", nip: "198205122009021003", role: "Guru/Tendik", email: "budi.santoso@guru.sma.belajar.id", subject: "Matematika" },
  { id: "4", username: "nurul", password: "guru123", name: "Nurul Hidayah, S.Pd.", nip: "198807152014022002", role: "Guru/Tendik", email: "nurul.hidayah@guru.sma.belajar.id", subject: "Bahasa Indonesia" },
  { id: "5", username: "ahmad", password: "guru123", name: "Ahmad Jufri, S.Kom.", nip: "199003212015031004", role: "Guru/Tendik", email: "ahmad.jufri@guru.sma.belajar.id", subject: "Informatika" },
  { id: "6", username: "dewi", password: "guru123", name: "Dewi Lestari, S.Pd.", nip: "199211052019032005", role: "Guru/Tendik", email: "dewi.lestari@guru.sma.belajar.id", subject: "Biologi" }
];

export const DEFAULT_DOCUMENTS: DocumentRecord[] = [
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
];

export const DEFAULT_ABSENSI: AbsensiRecord[] = [
  { id: "a1", date: new Date().toISOString().split('T')[0], userId: "3", name: "Budi Santoso, S.Pd.", status: "Hadir", time: "07:15:20", notes: "Tepat waktu" },
  { id: "a2", date: new Date().toISOString().split('T')[0], userId: "4", name: "Nurul Hidayah, S.Pd.", status: "Hadir", time: "07:20:10", notes: "Tepat waktu" },
  { id: "a3", date: new Date().toISOString().split('T')[0], userId: "5", name: "Ahmad Jufri, S.Kom.", status: "Izin", time: "08:00:00", notes: "Menghadiri Diknas Sofifi" },
  { id: "a4", date: new Date().toISOString().split('T')[0], userId: "6", name: "Dewi Lestari, S.Pd.", status: "Hadir", time: "07:10:45", notes: "Tepat waktu" }
];

export const DEFAULT_JURNAL: JournalRecord[] = [
  { id: "j1", date: new Date().toISOString().split('T')[0], userId: "3", name: "Budi Santoso, S.Pd.", subject: "Matematika", classRoom: "XII IPA 1", material: "Turunan Fungsi Aljabar", notes: "Siswa aktif mengerjakan latihan soal di papan tulis.", timestamp: "09:30:00" },
  { id: "j2", date: new Date().toISOString().split('T')[0], userId: "4", name: "Nurul Hidayah, S.Pd.", subject: "Bahasa Indonesia", classRoom: "XI IPS 2", material: "Teks Editorial & Opini", notes: "Diskusi kelompok mengenai isu sosial daerah.", timestamp: "10:15:00" },
  { id: "j3", date: new Date().toISOString().split('T')[0], userId: "5", name: "Ahmad Jufri, S.Kom.", subject: "Informatika", classRoom: "X MIPA", material: "Algoritma Pemrograman Dasar", notes: "Praktikum dasar Python menggunakan web compiler.", timestamp: "11:00:00" }
];

export const DEFAULT_SUPERVISI: SupervisionRecord[] = [
  { id: "s1", userId: "3", teacherName: "Budi Santoso, S.Pd.", supervisor: "Drs. H. Abdullah Mahmud, M.Pd.", date: "2025-09-10", pedagogicalScore: 88, professionalScore: 90, socialScore: 85, personalityScore: 92, averageScore: 88.7, notes: "Perangkat ajar (ATP, PROTA, PROSEM, Modul Ajar) sangat tertib dan lengkap. Pembelajaran berdiferensiasi terlaksana sangat baik." },
  { id: "s2", userId: "4", teacherName: "Nurul Hidayah, S.Pd.", supervisor: "Siti Rahma Umar, S.Pd.", date: "2025-09-12", pedagogicalScore: 85, professionalScore: 88, socialScore: 90, personalityScore: 89, averageScore: 88.0, notes: "Media pembelajaran visual menarik. ATP dan Modul Ajar selaras dengan capaian Kurikulum Merdeka." }
];

// Helper to access LocalStorage safely
export function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem('siakad_' + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

export function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem('siakad_' + key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// Client-side authentication fallback (ensures Vercel login never throws connection error)
export function clientAuthenticate(username: string, password: string): { success: boolean; user?: User; message?: string } {
  const users = getLocal<User[]>('users', DEFAULT_USERS);
  const matched = users.find(u => u.username === username && u.password === password);
  if (matched) {
    return { success: true, user: matched };
  }
  return { success: false, message: 'Username atau password salah.' };
}
