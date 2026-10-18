export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  nip: string;
  role: 'Admin' | 'Guru/Tendik';
  email: string;
  subject?: string;
}

export interface AbsensiRecord {
  id: string;
  date: string;
  userId: string;
  name: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  time: string;
  notes: string;
}

export interface JournalRecord {
  id: string;
  date: string;
  userId: string;
  name: string;
  subject: string;
  classRoom: string;
  material: string;
  notes: string;
  timestamp: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  name: string;
  title: string;
  category: 'ATP' | 'PROTA' | 'PROSEM' | 'Modul Ajar' | 'Silabus' | 'RPP' | 'Prota/Prosem' | 'Lainnya';
  fileUrl: string;
  fileName: string;
  uploadDate: string;
  status: 'Menunggu' | 'Disetujui' | 'Revisi';
  notes?: string;
  fileContent?: string;
  fileSize?: string;
}

export interface SupervisionRecord {
  id: string;
  userId: string;
  teacherName: string;
  supervisor: string;
  date: string;
  pedagogicalScore: number;
  professionalScore: number;
  socialScore: number;
  personalityScore: number;
  averageScore: number;
  notes: string;
}

export interface SchoolSettings {
  schoolName: string;
  npsn: string;
  address: string;
  principalName: string;
  academicYear: string;
  semester: string;
}

export interface AuditLog {
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

