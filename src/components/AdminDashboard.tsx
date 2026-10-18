import React, { useState, useEffect } from 'react';
import { User, AbsensiRecord, JournalRecord, DocumentRecord, SupervisionRecord, SchoolSettings } from '../types';
import { 
  Users, FileText, CheckCircle2, Clock, Award, Plus, Trash2, Edit, 
  FileDown, Check, X, Sparkles, Building2, Eye, Filter, Search, 
  BookOpen, FolderOpen, AlertCircle, ExternalLink, Download, Layers, MessageSquare
} from 'lucide-react';
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
  // Navigation & Sub-feature state
  const [supervisiSubTab, setSupervisiSubTab] = useState<'perangkat' | 'nilai'>('perangkat');
  const [perangkatCategoryTab, setPerangkatCategoryTab] = useState<'SEMUA' | 'ATP' | 'PROTA' | 'PROSEM' | 'Modul Ajar'>('SEMUA');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Preview States
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [reviewDoc, setReviewDoc] = useState<DocumentRecord | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'Disetujui' as 'Disetujui' | 'Revisi' | 'Menunggu', notes: '' });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', nip: '', role: 'Guru/Tendik' as 'Admin' | 'Guru/Tendik', email: '', subject: '' });
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  const [showSupervisionModal, setShowSupervisionModal] = useState(false);
  const [supForm, setSupForm] = useState({ 
    userId: '', 
    teacherName: '', 
    supervisor: settings.principalName, 
    date: new Date().toISOString().split('T')[0], 
    pedagogicalScore: 85, 
    professionalScore: 85, 
    socialScore: 85, 
    personalityScore: 85, 
    notes: '' 
  });

  const [settingForm, setSettingForm] = useState(settings);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // In-app Toast message (replaces window.alert)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setSettingForm(settings);
  }, [settings]);

  // Handle User CRUD
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm)
        });
        showToast('Data pengguna berhasil diperbarui!');
      } else {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm)
        });
        showToast('Pengguna baru berhasil ditambahkan!');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', name: '', nip: '', role: 'Guru/Tendik', email: '', subject: '' });
      refreshData();
    } catch (err) {
      showToast('Gagal menyimpan data pengguna', 'error');
    }
  };

  const executeDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    try {
      await fetch(`/api/users/${confirmDeleteUser.id}`, { method: 'DELETE' });
      showToast(`Pengguna ${confirmDeleteUser.name} berhasil dihapus.`);
      setConfirmDeleteUser(null);
      refreshData();
    } catch (err) {
      showToast('Gagal menghapus pengguna', 'error');
    }
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({ username: u.username, password: u.password || '', name: u.name, nip: u.nip, role: u.role, email: u.email, subject: u.subject || '' });
    setShowUserModal(true);
  };

  // Handle Supervision Assessment Save
  const handleSaveSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      showToast('Penilaian supervisi tatap muka berhasil disimpan!');
      refreshData();
    } catch (err) {
      showToast('Gagal menyimpan penilaian supervisi', 'error');
    }
  };

  // Handle Document Review (Status & Notes)
  const handleOpenReview = (doc: DocumentRecord) => {
    setReviewDoc(doc);
    setReviewForm({
      status: doc.status,
      notes: doc.notes || ''
    });
  };

  const handleSaveDocReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDoc) return;
    try {
      await fetch(`/api/dokumen/${reviewDoc.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewForm.status,
          notes: reviewForm.notes
        })
      });
      showToast(`Telaah dokumen ${reviewDoc.category} berhasil disimpan (${reviewForm.status})!`);
      setReviewDoc(null);
      refreshData();
    } catch (err) {
      showToast('Gagal menyimpan hasil telaah dokumen', 'error');
    }
  };

  // Handle Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingForm)
      });
      showToast('Pengaturan identitas sekolah berhasil diperbarui!');
      refreshData();
    } catch (err) {
      showToast('Gagal memperbarui pengaturan sekolah', 'error');
    }
  };

  // PDF Export
  const exportPdfReport = (title: string, type: 'absensi' | 'supervisi' | 'dokumen' | 'perangkat_supervisi', categoryFilter?: string) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(settings.schoolName, 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`NPSN: ${settings.npsn} • Tahun Ajaran: ${settings.academicYear} (${settings.semester})`, 14, 25);
      doc.text(`Alamat: ${settings.address}`, 14, 30);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Penanggung Jawab: ${settings.principalName}`, 14, 36);

      if (type === 'absensi') {
        const tableData = absensi.map((a, i) => [i + 1, a.date, a.name, a.status, a.time, a.notes]);
        autoTable(doc, {
          startY: 42,
          head: [['No', 'Tanggal', 'Nama Guru/Tendik', 'Status', 'Waktu', 'Keterangan']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 8 }
        });
      } else if (type === 'supervisi') {
        const tableData = supervisi.map((s, i) => [i + 1, s.teacherName, s.supervisor, s.date, s.averageScore, s.notes]);
        autoTable(doc, {
          startY: 42,
          head: [['No', 'Nama Guru', 'Supervisor', 'Tanggal', 'Rata-Rata', 'Catatan']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 8 }
        });
      } else if (type === 'dokumen' || type === 'perangkat_supervisi') {
        let filtered = dokumen;
        if (categoryFilter && categoryFilter !== 'SEMUA') {
          filtered = filtered.filter(d => d.category.toLowerCase() === categoryFilter.toLowerCase());
        } else if (type === 'perangkat_supervisi') {
          filtered = filtered.filter(d => ['ATP', 'PROTA', 'PROSEM', 'Modul Ajar'].includes(d.category));
        }

        const tableData = filtered.map((d, i) => [
          i + 1,
          d.name,
          d.category,
          d.title,
          d.uploadDate,
          d.status,
          d.notes || '-'
        ]);

        autoTable(doc, {
          startY: 42,
          head: [['No', 'Nama Guru', 'Kategori', 'Judul Perangkat Ajar', 'Tgl Upload', 'Status', 'Catatan Telaah']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 7.5 }
        });
      }

      doc.save(`Laporan_${title}_SMA_N_14_Tidore.pdf`);
      showToast('Laporan PDF berhasil diunduh!');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file PDF', 'error');
    }
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
      showToast('Gagal memproses rekomendasi AI', 'error');
    } finally {
      setLoadingAi(false);
    }
  };

  // Calculations for Overview & Perangkat Ajar
  const teachersCount = users.filter(u => u.role === 'Guru/Tendik').length;
  const todayAttendanceCount = absensi.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Hadir').length;
  const pendingDocsCount = dokumen.filter(d => d.status === 'Menunggu').length;

  // Filtered documents for Perangkat Ajar Supervisi
  const filteredPerangkatList = dokumen.filter(doc => {
    // Category filter
    if (perangkatCategoryTab !== 'SEMUA') {
      if (doc.category.toUpperCase() !== perangkatCategoryTab.toUpperCase()) return false;
    }
    // Teacher filter
    if (filterTeacher !== 'ALL' && doc.userId !== filterTeacher) return false;
    // Status filter
    if (filterStatus !== 'ALL' && doc.status !== filterStatus) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchFile = doc.fileName.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchFile) return false;
    }
    return true;
  });

  // Category counts
  const atpDocs = dokumen.filter(d => d.category.toUpperCase() === 'ATP');
  const protaDocs = dokumen.filter(d => d.category.toUpperCase() === 'PROTA');
  const prosemDocs = dokumen.filter(d => d.category.toUpperCase() === 'PROSEM');
  const modulDocs = dokumen.filter(d => d.category.toUpperCase() === 'MODUL AJAR');

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold flex items-center gap-3 transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

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
                  { name: 'Budi Santoso, S.Pd. (Matematika)', val: 100, color: 'bg-emerald-500' },
                  { name: 'Nurul Hidayah, S.Pd. (B. Indonesia)', val: 95, color: 'bg-blue-600' },
                  { name: 'Dewi Lestari, S.Pd. (Biologi)', val: 100, color: 'bg-purple-600' },
                  { name: 'Ahmad Jufri, S.Kom. (Informatika)', val: 75, color: 'bg-amber-500' }
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

      {/* 2. SUPERVISI AKADEMIK TAB WITH SUB-FEATURES */}
      {activeTab === 'supervisi' && (
        <div className="space-y-6">
          {/* Header & Sub-feature Tabs Toggle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase">
                    Supervisi Akademik
                  </span>
                  <span className="text-xs text-gray-400">• SMA Negeri 14 Kota Tidore Kepulauan</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mt-1">
                  Supervisi Akademik & Telaah Perangkat Ajar Guru
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pantau, periksa hasil upload dokumen (ATP, PROTA, PROSEM, Modul Ajar), dan catat penilaian supervisi tatap muka KBM.
                </p>
              </div>

              {/* Sub-feature Toggle Buttons */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                <button
                  onClick={() => setSupervisiSubTab('perangkat')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                    supervisiSubTab === 'perangkat'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Pratinjau Hasil Aplotan Perangkat Ajar
                </button>
                <button
                  onClick={() => setSupervisiSubTab('nilai')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                    supervisiSubTab === 'nilai'
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Penilaian Supervisi Tatap Muka
                </button>
              </div>
            </div>

            {/* Quick Stats for Perangkat Ajar Uploaded */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div 
                onClick={() => { setSupervisiSubTab('perangkat'); setPerangkatCategoryTab('ATP'); }}
                className="cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-2xl p-4 transition text-blue-950"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-700">ATP</span>
                  <span className="bg-blue-200/80 text-blue-900 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {atpDocs.filter(d => d.status === 'Disetujui').length}/{atpDocs.length} Disetujui
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-950">{atpDocs.length} Berkas</div>
                <p className="text-[11px] text-blue-600 mt-1">Alur Tujuan Pembelajaran</p>
              </div>

              <div 
                onClick={() => { setSupervisiSubTab('perangkat'); setPerangkatCategoryTab('PROTA'); }}
                className="cursor-pointer bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-2xl p-4 transition text-emerald-950"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-700">PROTA</span>
                  <span className="bg-emerald-200/80 text-emerald-900 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {protaDocs.filter(d => d.status === 'Disetujui').length}/{protaDocs.length} Disetujui
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950">{protaDocs.length} Berkas</div>
                <p className="text-[11px] text-emerald-600 mt-1">Program Tahunan Guru</p>
              </div>

              <div 
                onClick={() => { setSupervisiSubTab('perangkat'); setPerangkatCategoryTab('PROSEM'); }}
                className="cursor-pointer bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200/80 rounded-2xl p-4 transition text-purple-950"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-700">PROSEM</span>
                  <span className="bg-purple-200/80 text-purple-900 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {prosemDocs.filter(d => d.status === 'Disetujui').length}/{prosemDocs.length} Disetujui
                  </span>
                </div>
                <div className="text-2xl font-black text-purple-950">{prosemDocs.length} Berkas</div>
                <p className="text-[11px] text-purple-600 mt-1">Program Semester Ganjil/Genap</p>
              </div>

              <div 
                onClick={() => { setSupervisiSubTab('perangkat'); setPerangkatCategoryTab('Modul Ajar'); }}
                className="cursor-pointer bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/80 rounded-2xl p-4 transition text-amber-950"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-700">Modul Ajar</span>
                  <span className="bg-amber-200/80 text-amber-900 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {modulDocs.filter(d => d.status === 'Disetujui').length}/{modulDocs.length} Disetujui
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-950">{modulDocs.length} Berkas</div>
                <p className="text-[11px] text-amber-600 mt-1">Modul / RPP Kurikulum Merdeka</p>
              </div>
            </div>
          </div>

          {/* SUB-FEATURE 1: PRATINJAU HASIL APLOTAN ATP, PROTA, PROSEM, DAN MODUL AJAR SECARA TERPISAH */}
          {supervisiSubTab === 'perangkat' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              {/* Category Sub-Tabs (Separated View) */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex overflow-x-auto space-x-2 pb-2 lg:pb-0 w-full lg:w-auto scrollbar-none">
                  <button
                    onClick={() => setPerangkatCategoryTab('SEMUA')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      perangkatCategoryTab === 'SEMUA'
                        ? 'bg-blue-900 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>🌟 Semua Dokumen</span>
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-mono">
                      {dokumen.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPerangkatCategoryTab('ATP')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      perangkatCategoryTab === 'ATP'
                        ? 'bg-blue-700 text-white shadow'
                        : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                    }`}
                  >
                    <span>📘 ATP (Alur Tujuan Pembelajaran)</span>
                    <span className="bg-blue-900/30 px-2 py-0.5 rounded-full text-xs font-mono">
                      {atpDocs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPerangkatCategoryTab('PROTA')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      perangkatCategoryTab === 'PROTA'
                        ? 'bg-emerald-700 text-white shadow'
                        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    <span>📗 PROTA (Program Tahunan)</span>
                    <span className="bg-emerald-900/30 px-2 py-0.5 rounded-full text-xs font-mono">
                      {protaDocs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPerangkatCategoryTab('PROSEM')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      perangkatCategoryTab === 'PROSEM'
                        ? 'bg-purple-700 text-white shadow'
                        : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    <span>📙 PROSEM (Program Semester)</span>
                    <span className="bg-purple-900/30 px-2 py-0.5 rounded-full text-xs font-mono">
                      {prosemDocs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setPerangkatCategoryTab('Modul Ajar')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      perangkatCategoryTab === 'Modul Ajar'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <span>📕 Modul Ajar</span>
                    <span className="bg-amber-900/30 px-2 py-0.5 rounded-full text-xs font-mono">
                      {modulDocs.length}
                    </span>
                  </button>
                </div>

                {/* PDF Export Button for Perangkat Ajar */}
                <button
                  onClick={() => exportPdfReport(`Supervisi_${perangkatCategoryTab}`, 'perangkat_supervisi', perangkatCategoryTab)}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition shadow self-end lg:self-auto shrink-0"
                >
                  <FileDown className="w-4 h-4" />
                  Cetak PDF Rekap {perangkatCategoryTab !== 'SEMUA' ? perangkatCategoryTab : 'Perangkat Ajar'}
                </button>
              </div>

              {/* Filters & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari guru, judul berkas..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter Guru:</span>
                  <select
                    value={filterTeacher}
                    onChange={e => setFilterTeacher(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="ALL">Semua Guru</option>
                    {users.filter(u => u.role === 'Guru/Tendik').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.subject || 'Guru'})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Revisi">Perlu Revisi</option>
                  </select>
                </div>
              </div>

              {/* Document Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="p-4 font-semibold">Nama Guru & Mapel</th>
                      <th className="p-4 font-semibold">Kategori</th>
                      <th className="p-4 font-semibold">Judul & Nama Berkas</th>
                      <th className="p-4 font-semibold">Tgl Aplot</th>
                      <th className="p-4 font-semibold text-center">Status Verifikasi</th>
                      <th className="p-4 font-semibold">Catatan Supervisi</th>
                      <th className="p-4 font-semibold text-center">Aksi Telaah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredPerangkatList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">
                          Tidak ada berkas {perangkatCategoryTab !== 'SEMUA' ? perangkatCategoryTab : 'perangkat ajar'} yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPerangkatList.map((d) => (
                        <tr key={d.id} className="hover:bg-blue-50/40 transition">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{d.name}</div>
                            <div className="text-xs text-gray-500">
                              {users.find(u => u.id === d.userId)?.subject || 'Guru Pengampu'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              d.category.toUpperCase() === 'ATP' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                              d.category.toUpperCase() === 'PROTA' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                              d.category.toUpperCase() === 'PROSEM' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                              'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                              {d.category}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="font-semibold text-gray-900 truncate" title={d.title}>
                              {d.title}
                            </div>
                            <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="truncate max-w-[180px]">{d.fileName}</span>
                              {d.fileSize && <span className="bg-gray-100 px-1.5 py-0.2 rounded text-[10px]">{d.fileSize}</span>}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono text-gray-600">
                            {d.uploadDate}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                              d.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              d.status === 'Revisi' ? 'bg-red-100 text-red-800 border border-red-300' : 
                              'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {d.status === 'Revisi' ? 'Perlu Revisi' : d.status}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs text-xs text-gray-600">
                            {d.notes ? (
                              <p className="line-clamp-2 italic text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-200/60">
                                "{d.notes}"
                              </p>
                            ) : (
                              <span className="text-gray-400 italic">Belum ada catatan</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Pratinjau Dokumen Button */}
                              <button
                                onClick={() => setPreviewDoc(d)}
                                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs border border-blue-200"
                                title="Pratinjau Hasil Aplotan"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Pratinjau</span>
                              </button>

                              {/* Telaah Supervisi Button */}
                              <button
                                onClick={() => handleOpenReview(d)}
                                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-blue-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                                title="Verifikasi dan Beri Catatan Supervisi"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Telaah</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-FEATURE 2: PENILAIAN SUPERVISI TATAP MUKA KBM */}
          {supervisiSubTab === 'nilai' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tabel Nilai Supervisi Akademik Tatap Muka</h3>
                  <p className="text-sm text-gray-500">Skor 4 aspek kompetensi guru: Pedagogik, Profesional, Sosial, dan Kepribadian.</p>
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
                    Input Nilai Supervisi Baru
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
                      <button onClick={() => setConfirmDeleteUser(u)} className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition" title="Hapus">
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

      {/* 5. DOKUMEN & PERANGKAT AJAR TAB (UMUM) */}
      {activeTab === 'dokumen' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Verifikasi Dokumen & Perangkat Ajar Sekolah</h2>
              <p className="text-sm text-gray-500">Semua berkas ATP, PROTA, PROSEM, Modul Ajar, dan Silabus yang diunggah guru.</p>
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
                      <button
                        onClick={() => setPreviewDoc(d)}
                        className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Pratinjau
                      </button>
                      <button
                        onClick={() => handleOpenReview(d)}
                        className="bg-amber-500 hover:bg-amber-400 text-blue-950 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Verifikasi
                      </button>
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

      {/* MODAL 1: PRATINJAU DOKUMEN SUPERVISI (INTERAKTIF & BEBAS DARI BLOKIR IFRAME) */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  previewDoc.category.toUpperCase() === 'ATP' ? 'bg-blue-100 text-blue-800' :
                  previewDoc.category.toUpperCase() === 'PROTA' ? 'bg-emerald-100 text-emerald-800' :
                  previewDoc.category.toUpperCase() === 'PROSEM' ? 'bg-purple-100 text-purple-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Pratinjau Hasil Aplotan Perangkat Ajar
                  </span>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">
                    {previewDoc.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Details & Attributes */}
            <div className="py-4 space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <div>
                  <span className="text-gray-400 block font-medium">Kategori:</span>
                  <span className="font-bold text-blue-900 text-sm">{previewDoc.category}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Nama Guru:</span>
                  <span className="font-bold text-gray-900">{previewDoc.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Tanggal Upload:</span>
                  <span className="font-mono text-gray-700">{previewDoc.uploadDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Status Verifikasi:</span>
                  <span className={`font-bold inline-block px-2 py-0.5 rounded-full text-[11px] mt-0.5 ${
                    previewDoc.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' :
                    previewDoc.status === 'Revisi' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {previewDoc.status}
                  </span>
                </div>
              </div>

              {/* Simulated Viewer Card */}
              <div className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-b from-gray-50/50 to-white">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{previewDoc.fileName}</span>
                    {previewDoc.fileSize && <span className="text-gray-400">({previewDoc.fileSize})</span>}
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono">
                    Google Drive Cloud Storage
                  </span>
                </div>

                {/* Structure Outline depending on Category */}
                <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                  <p className="font-semibold text-gray-900 uppercase tracking-wider text-[11px] text-blue-900">
                    Komponen Kurikulum Merdeka Terdeteksi:
                  </p>
                  {previewDoc.category.toUpperCase() === 'ATP' && (
                    <ul className="list-disc list-inside space-y-1.5 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                      <li><strong>Rasional & Capaian Pembelajaran (CP)</strong>: Sesuai Keputusan BSKAP Kemendikbudristek.</li>
                      <li><strong>Alur Tujuan Pembelajaran (ATP)</strong>: Runtut secara hierarkis per fase & kelas.</li>
                      <li><strong>Perkiraan Jumlah Jam Pelajaran (JP)</strong>: Terdistribusi proporsional per unit topik.</li>
                      <li><strong>Profil Pelajar Pancasila</strong>: Terintegrasi dalam setiap capaian elemen.</li>
                    </ul>
                  )}
                  {previewDoc.category.toUpperCase() === 'PROTA' && (
                    <ul className="list-disc list-inside space-y-1.5 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                      <li><strong>Pemetaan Bab dan Materi</strong>: Semester Ganjil & Genap tahun ajaran {settings.academicYear}.</li>
                      <li><strong>Alokasi Pekan Efektif KBM</strong>: Mengacu pada Kalender Pendidikan Provinsi Maluku Utara.</li>
                      <li><strong>Distribusi Total JP</strong>: Rincian tatap muka, asesmen sumatif, dan pekan cadangan.</li>
                    </ul>
                  )}
                  {previewDoc.category.toUpperCase() === 'PROSEM' && (
                    <ul className="list-disc list-inside space-y-1.5 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                      <li><strong>Distribusi Waktu Mingguan</strong>: Matriks jadwal pekan 1 s.d pekan 20 semester berjalan.</li>
                      <li><strong>Plotting Agenda Evaluasi</strong>: Penilaian Formatif, Sumatif Tengah Semester & Akhir Semester.</li>
                      <li><strong>Kegiatan Jeda & Pengolahan Rapor</strong>: Sinkron dengan jadwal akademik sekolah.</li>
                    </ul>
                  )}
                  {previewDoc.category.toUpperCase() === 'MODUL AJAR' && (
                    <ul className="list-disc list-inside space-y-1.5 bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                      <li><strong>Identitas & Informasi Umum</strong>: Fase, target peserta didik, model pembelajaran.</li>
                      <li><strong>Komponen Inti</strong>: Tujuan pembelajaran, pemahaman bermakna, pertanyaan pemantik.</li>
                      <li><strong>Kegiatan Pembelajaran Berdiferensiasi</strong>: Langkah awal, inti, dan penutup kontekstual.</li>
                      <li><strong>Asesmen & LKPD</strong>: Rubrik pengamatan dan instrumen asesmen lengkap.</li>
                    </ul>
                  )}

                  {previewDoc.notes && (
                    <div className="mt-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-1">Catatan Supervisi Terakhir:</span>
                      <p className="text-amber-800 italic">"{previewDoc.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100">
              <a
                href={previewDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition w-full sm:w-auto justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Link Google Drive Asli
              </a>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const docToReview = previewDoc;
                    setPreviewDoc(null);
                    handleOpenReview(docToReview);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-blue-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow w-full sm:w-auto"
                >
                  Ubah Hasil Telaah
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition w-full sm:w-auto"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TELAAH / VERIFIKASI PERANGKAT AJAR OLEH SUPERVISOR */}
      {reviewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Form Telaah Supervisi</span>
                <h3 className="text-lg font-bold text-gray-900">
                  Verifikasi Berkas {reviewDoc.category}
                </h3>
              </div>
              <button onClick={() => setReviewDoc(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocReview} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 text-xs text-gray-700">
                <div className="font-bold text-gray-900">{reviewDoc.title}</div>
                <div className="text-gray-500 mt-0.5">Guru: {reviewDoc.name} • {reviewDoc.fileName}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Keputusan Status Verifikasi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, status: 'Disetujui' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      reviewForm.status === 'Disetujui'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    ✓ Disetujui
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, status: 'Revisi' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      reviewForm.status === 'Revisi'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    ⚠ Perlu Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, status: 'Menunggu' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      reviewForm.status === 'Menunggu'
                        ? 'bg-amber-500 text-blue-950 border-amber-500 shadow'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    ⏳ Menunggu
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Catatan Telaah Supervisi / Rekomendasi Perbaikan
                </label>
                <textarea
                  value={reviewForm.notes}
                  onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })}
                  placeholder="Tuliskan catatan apresiasi, catatan alur tujuan, asesmen, atau poin yang perlu disempurnakan guru..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  rows={4}
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewDoc(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Simpan Hasil Telaah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: USER ADD / EDIT */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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

      {/* MODAL 4: CONFIRM DELETE USER (REPLACES WINDOW.CONFIRM) */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus Pengguna</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus akun guru/pengguna <strong>"{confirmDeleteUser.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow"
              >
                Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SUPERVISION SCORE INPUT */}
      {showSupervisionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Input Penilaian Supervisi Akademik Tatap Muka</h3>
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
