import React, { useState, useEffect } from 'react';
import { User, AbsensiRecord, JournalRecord, DocumentRecord, SupervisionRecord, SchoolSettings } from '../types';
import { Users, FileText, CheckCircle2, Clock, Award, Plus, Trash2, Edit, Printer, FileDown, Check, X, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdminDashboardProps {
  activeTab: string;
  users: User[];
  absensi: AbsensiRecord[];
  jurnal: JournalRecord[];
  dokumen: DocumentRecord[];
  supervisi: SupervisionRecord[];
  settings: SchoolSettings;
  refreshData: () => void;
}

export default function AdminDashboard({
  activeTab,
  users,
  absensi,
  jurnal,
  dokumen,
  supervisi,
  settings,
  refreshData
}: AdminDashboardProps) {
  // Modal & form states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', nip: '', role: 'Guru/Tendik' as 'Admin' | 'Guru/Tendik', email: '', subject: '' });

  const [showSupervisionModal, setShowSupervisionModal] = useState(false);
  const [supForm, setSupForm] = useState({ userId: '', teacherName: '', supervisor: settings.principalName, date: new Date().toISOString().split('T')[0], pedagogicalScore: 85, professionalScore: 85, socialScore: 85, personalityScore: 85, notes: '' });

  const [settingForm, setSettingForm] = useState(settings);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setSettingForm(settings);
  }, [settings]);

  // Handle User CRUD
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
    } else {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
    }
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ username: '', password: '', name: '', nip: '', role: 'Guru/Tendik', email: '', subject: '' });
    refreshData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      refreshData();
    }
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({ username: u.username, password: u.password || '', name: u.name, nip: u.nip, role: u.role, email: u.email, subject: u.subject || '' });
    setShowUserModal(true);
  };

  // Handle Supervision Save
  const handleSaveSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacher = users.find(u => u.id === supForm.userId);
    const payload = {
      ...supForm,
      teacherName: selectedTeacher ? selectedTeacher.name : supForm.teacherName
    };
    await fetch('/api/supervisi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setShowSupervisionModal(false);
    refreshData();
  };

  // Handle Document Approval
  const handleUpdateDocStatus = async (id: string, status: 'Disetujui' | 'Revisi') => {
    await fetch(`/api/dokumen/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    refreshData();
  };

  // Handle Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingForm)
    });
    alert('Pengaturan sekolah berhasil diperbarui!');
    refreshData();
  };

  // PDF Export
  const exportPdfReport = (title: string, type: 'absensi' | 'supervisi' | 'dokumen') => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.schoolName, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Laporan ${title} - Tahun Ajaran ${settings.academicYear}`, 14, 27);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | NPSN: ${settings.npsn}`, 14, 34);

    if (type === 'absensi') {
      const tableData = absensi.map((a, i) => [i + 1, a.date, a.name, a.status, a.time, a.notes]);
      autoTable(doc, {
        startY: 42,
        head: [['No', 'Tanggal', 'Nama Guru/Tendik', 'Status', 'Waktu', 'Keterangan']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }
      });
    } else if (type === 'supervisi') {
      const tableData = supervisi.map((s, i) => [i + 1, s.teacherName, s.supervisor, s.date, s.averageScore, s.notes]);
      autoTable(doc, {
        startY: 42,
        head: [['No', 'Nama Guru', 'Supervisor', 'Tanggal', 'Rata-Rata', 'Catatan']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }
      });
    } else if (type === 'dokumen') {
      const tableData = dokumen.map((d, i) => [i + 1, d.name, d.title, d.category, d.uploadDate, d.status]);
      autoTable(doc, {
        startY: 42,
        head: [['No', 'Nama Guru', 'Judul Dokumen', 'Kategori', 'Tanggal', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }
      });
    }

    doc.save(`Laporan_${title}_SMA_N_14_Tidore.pdf`);
  };

  // AI Feedback Generator
  const generateAiFeedback = async (s: SupervisionRecord) => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/supervisor-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherName: s.teacherName,
          subject: 'Mata Pelajaran',
          scores: { pedagogical: s.pedagogicalScore, professional: s.professionalScore, social: s.socialScore, personality: s.personalityScore },
          notes: s.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiFeedback(data.feedback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const teachersCount = users.filter(u => u.role === 'Guru/Tendik').length;
  const todayAttendanceCount = absensi.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Hadir').length;
  const pendingDocsCount = dokumen.filter(d => d.status === 'Menunggu').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* 1. DASHBOARD OVERVIEW TAB */}
      {activeTab === 'dashboard' && (
        <>
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="bg-amber-500 text-blue-950 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Dasbor Administrator / Kepala Sekolah
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mt-3">
                Selamat Datang, {settings.principalName}
              </h2>
              <p className="text-blue-100 text-sm mt-2 max-w-2xl leading-relaxed">
                Pusat kendali monitoring akademik dan administrasi guru <span className="font-semibold text-amber-300">{settings.schoolName}</span>. Tahun Ajaran {settings.academicYear} Semester {settings.semester}.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 pointer-events-none">
              <Building2 className="w-96 h-96 text-white" />
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Guru & Tendik</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{teachersCount} Orang</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Kehadiran Hadir Hari Ini</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{todayAttendanceCount} Guru</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Dokumen Menunggu Verifikasi</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{pendingDocsCount} Berkas</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Supervisi Akademik</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{supervisi.length} Guru</p>
              </div>
            </div>
          </div>

          {/* Charts & Completeness Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teaching Tool Completeness Bar Chart Simulation */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Kelengkapan Perangkat Ajar Guru</h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Kurikulum Merdeka</span>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Budi Santoso, S.Pd. (Matematika)', val: 95, color: 'bg-emerald-500' },
                  { name: 'Nurul Hidayah, S.Pd. (B. Indonesia)', val: 90, color: 'bg-blue-600' },
                  { name: 'Ahmad Jufri, S.Kom. (Informatika)', val: 80, color: 'bg-amber-500' },
                  { name: 'Dewi Lestari, S.Pd. (Biologi)', val: 85, color: 'bg-purple-600' }
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                      <span>{item.name}</span>
                      <span>{item.val}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Aktivitas Jurnal Mengajar Hari Ini</h3>
                <span className="text-xs text-gray-500">{jurnal.length} Catatan</span>
              </div>
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                {jurnal.map((j) => (
                  <div key={j.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-xs mt-0.5">
                      {j.timestamp.slice(0, 5)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-900 truncate">{j.name}</span>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">{j.classRoom}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Mapel: {j.subject} • Materi: {j.material}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">"{j.notes}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. SUPERVISI AKADEMIK TAB */}
      {activeTab === 'supervisi' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Penilaian Supervisi Akademik Guru</h2>
              <p className="text-sm text-gray-500">Penilaian aspek pedagogik, profesional, sosial, dan kepribadian oleh Kepala Sekolah / Waka.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportPdfReport('Supervisi_Akademik', 'supervisi')}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow"
              >
                <FileDown className="w-4 h-4" />
                Cetak PDF Supervisi
              </button>
              <button
                onClick={() => setShowSupervisionModal(true)}
                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow"
              >
                <Plus className="w-4 h-4" />
                Input Supervisi Baru
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Nama Guru</th>
                  <th className="p-4 font-semibold">Supervisor</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold text-center">Pedagogik</th>
                  <th className="p-4 font-semibold text-center">Profesional</th>
                  <th className="p-4 font-semibold text-center">Sosial</th>
                  <th className="p-4 font-semibold text-center">Kepribadian</th>
                  <th className="p-4 font-semibold text-center">Rata-Rata</th>
                  <th className="p-4 font-semibold text-center">Aksi AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {supervisi.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80">
                    <td className="p-4 font-bold text-gray-900">{s.teacherName}</td>
                    <td className="p-4 text-gray-600">{s.supervisor}</td>
                    <td className="p-4 text-gray-500">{s.date}</td>
                    <td className="p-4 text-center font-semibold text-blue-900">{s.pedagogicalScore}</td>
                    <td className="p-4 text-center font-semibold text-blue-900">{s.professionalScore}</td>
                    <td className="p-4 text-center font-semibold text-blue-900">{s.socialScore}</td>
                    <td className="p-4 text-center font-semibold text-blue-900">{s.personalityScore}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800">
                        {s.averageScore}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => generateAiFeedback(s)}
                        className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        AI Saran
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Feedback Modal Box */}
          {aiFeedback && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 relative">
              <button onClick={() => setAiFeedback(null)} className="absolute top-4 right-4 text-amber-800 hover:text-amber-950">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-amber-900 font-bold mb-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Rekomendasi Pembinaan Profesional (Gemini AI)</span>
              </div>
              <div className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
                {aiFeedback}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MANAJEMEN PENGGUNA TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manajemen Pengguna (Guru & Tendik)</h2>
              <p className="text-sm text-gray-500">Kelola akun login, NIP, dan hak akses guru dan tenaga kependidikan.</p>
            </div>
            <button
              onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', name: '', nip: '', role: 'Guru/Tendik', email: '', subject: '' }); setShowUserModal(true); }}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow"
            >
              <Plus className="w-4 h-4" />
              Tambah Guru/Admin Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Nama Lengkap & NIP</th>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Mata Pelajaran</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500 font-mono">NIP: {u.nip || '-'}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-800 bg-blue-50/50 rounded">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'Admin' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{u.subject || '-'}</td>
                    <td className="p-4 text-gray-500 text-xs font-mono">{u.email}</td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => openEditUser(u)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PRATINJAU KEHADIRAN TAB */}
      {activeTab === 'absensi' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pratinjau Rekapitulasi Kehadiran Guru</h2>
              <p className="text-sm text-gray-500">Data kehadiran harian guru dan tenaga kependidikan secara real-time.</p>
            </div>
            <button
              onClick={() => exportPdfReport('Kehadiran_Guru', 'absensi')}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow"
            >
              <FileDown className="w-4 h-4" />
              Cetak PDF Kehadiran
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Tanggal & Waktu</th>
                  <th className="p-4 font-semibold">Nama Guru / Tendik</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {absensi.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/80">
                    <td className="p-4 text-gray-600 font-mono text-xs">
                      <div>{a.date}</div>
                      <div className="text-gray-400">{a.time}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{a.name}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                        a.status === 'Izin' ? 'bg-amber-100 text-amber-800' :
                        a.status === 'Sakit' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">{a.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DOKUMEN & PERANGKAT AJAR TAB */}
      {activeTab === 'dokumen' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Verifikasi Dokumen & Perangkat Ajar</h2>
              <p className="text-sm text-gray-500">Daftar file perangkat ajar (Modul Ajar, RPP, Silabus) yang diunggah oleh guru.</p>
            </div>
            <button
              onClick={() => exportPdfReport('Perangkat_Ajar', 'dokumen')}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow"
            >
              <FileDown className="w-4 h-4" />
              Cetak PDF Dokumen
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Nama Guru</th>
                  <th className="p-4 font-semibold">Judul Dokumen</th>
                  <th className="p-4 font-semibold">Kategori</th>
                  <th className="p-4 font-semibold">Tanggal Upload</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Aksi & Berkas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {dokumen.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/80">
                    <td className="p-4 font-bold text-gray-900">{d.name}</td>
                    <td className="p-4 text-gray-800 font-medium">{d.title}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {d.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs font-mono">{d.uploadDate}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        d.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'Revisi' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Buka File
                      </a>
                      {d.status === 'Menunggu' && (
                        <>
                          <button
                            onClick={() => handleUpdateDocStatus(d.id, 'Disetujui')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(d.id, 'Revisi')}
                            className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            Revisi
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PENGATURAN SEKOLAH TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pengaturan Profil & Sekolah</h2>
          <p className="text-sm text-gray-500 mb-6">Sesuaikan identitas resmi sekolah yang akan tercetak pada laporan PDF dan kop surat.</p>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={settingForm.schoolName}
                onChange={e => setSettingForm({ ...settingForm, schoolName: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">NPSN</label>
                <input
                  type="text"
                  value={settingForm.npsn}
                  onChange={e => setSettingForm({ ...settingForm, npsn: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tahun Ajaran & Semester</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settingForm.academicYear}
                    onChange={e => setSettingForm({ ...settingForm, academicYear: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={settingForm.semester}
                    onChange={e => setSettingForm({ ...settingForm, semester: e.target.value })}
                    className="w-28 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={settingForm.principalName}
                onChange={e => setSettingForm({ ...settingForm, principalName: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Alamat Sekolah</label>
              <textarea
                value={settingForm.address}
                onChange={e => setSettingForm({ ...settingForm, address: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                rows={3}
                required
              ></textarea>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition shadow"
              >
                Simpan Pengaturan Sekolah
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Add/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'Edit Pengguna' : 'Tambah Guru / Pengguna Baru'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Password</label>
                  <input
                    type="text"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">NIP</label>
                  <input
                    type="text"
                    value={userForm.nip}
                    onChange={e => setUserForm({ ...userForm, nip: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as 'Admin' | 'Guru/Tendik' })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="Guru/Tendik">Guru/Tendik</option>
                    <option value="Admin">Admin (Kepsek/Waka)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mata Pelajaran (Opsional)</label>
                <input
                  type="text"
                  value={userForm.subject}
                  onChange={e => setUserForm({ ...userForm, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-medium shadow"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervision Input Modal */}
      {showSupervisionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Input Penilaian Supervisi Akademik</h3>
            <form onSubmit={handleSaveSupervision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Pilih Guru</label>
                <select
                  value={supForm.userId}
                  onChange={e => setSupForm({ ...supForm, userId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                >
                  <option value="">-- Pilih Guru yang Disupervisi --</option>
                  {users.filter(u => u.role === 'Guru/Tendik').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.subject || 'Guru'})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nilai Pedagogik (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supForm.pedagogicalScore}
                    onChange={e => setSupForm({ ...supForm, pedagogicalScore: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nilai Profesional (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supForm.professionalScore}
                    onChange={e => setSupForm({ ...supForm, professionalScore: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nilai Sosial (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supForm.socialScore}
                    onChange={e => setSupForm({ ...supForm, socialScore: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nilai Kepribadian (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supForm.personalityScore}
                    onChange={e => setSupForm({ ...supForm, personalityScore: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Catatan Pengamat / Kepala Sekolah</label>
                <textarea
                  value={supForm.notes}
                  onChange={e => setSupForm({ ...supForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  rows={3}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSupervisionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-medium shadow"
                >
                  Simpan Supervisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
