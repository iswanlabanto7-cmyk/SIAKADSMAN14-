import React, { useState, useEffect } from 'react';
import { AuditLog, SchoolSettings } from '../types';
import { 
  ShieldCheck, ShieldAlert, History, Filter, Search, RotateCw, 
  FileDown, CheckCircle2, AlertTriangle, XCircle, Key, FileText, 
  UserCheck, Award, Settings, Terminal, Clock, Eye, Trash2, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditTrailProps {
  settings: SchoolSettings;
}

export default function AuditTrail({ settings }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-trail');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    try {
      await fetch('/api/audit-trail', { method: 'DELETE' });
      setLogs([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Error clearing audit logs:', err);
    }
  };

  // Export PDF Report of Audit Trail
  const exportAuditPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.schoolName, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`LAPORAN AUDIT TRAIL & LOG AKTIVITAS KEAMANAN SISTEM`, 14, 25);
    doc.text(`NPSN: ${settings.npsn} • Tahun Ajaran: ${settings.academicYear} • Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 31);

    const tableData = filteredLogs.map((l, i) => [
      i + 1,
      new Date(l.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' }),
      l.userName,
      l.userRole,
      l.action,
      l.description,
      l.ipAddress,
      l.status
    ]);

    autoTable(doc, {
      startY: 37,
      head: [['No', 'Waktu', 'Pengguna', 'Role', 'Aksi', 'Deskripsi Aktivitas', 'IP Address', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 7 }
    });

    doc.save(`Audit_Trail_SIAKAD_SMA14_${Date.now()}.pdf`);
  };

  // Filter calculations
  const filteredLogs = logs.filter(log => {
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'KBM') {
        if (log.category !== 'ABSENSI' && log.category !== 'JURNAL') return false;
      } else if (log.category !== categoryFilter) {
        return false;
      }
    }
    if (roleFilter !== 'ALL' && log.userRole !== roleFilter) return false;
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchIp = log.ipAddress.toLowerCase().includes(q);
      if (!matchUser && !matchAction && !matchDesc && !matchIp) return false;
    }
    return true;
  });

  const authCount = logs.filter(l => l.category === 'AUTH').length;
  const docCount = logs.filter(l => l.category === 'DOKUMEN' || l.category === 'SUPERVISI').length;
  const kbmCount = logs.filter(l => l.category === 'ABSENSI' || l.category === 'JURNAL').length;
  const alertCount = logs.filter(l => l.status === 'WARNING' || l.status === 'FAILED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Security & Accountability Module
              </span>
              <span className="text-xs text-slate-400">• Real-Time Logging</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Audit Trail & Log Aktivitas Pengguna
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Memantau riwayat autentikasi login, unggahan berkas perangkat ajar, pencatatan KBM, telaah supervisi, dan perubahan sistem di {settings.schoolName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-xs transition border border-slate-700 shadow"
              title="Perbarui Log"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportAuditPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs transition shadow-md"
              title="Unduh Laporan Audit PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Cetak Laporan PDF</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 px-3 py-2.5 rounded-xl font-medium text-xs transition border border-red-800/60"
              title="Kosongkan Riwayat Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Aktivitas</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{logs.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Autentikasi Akun</p>
            <p className="text-2xl font-black text-emerald-950 mt-0.5">{authCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-700 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Dokumen & Supervisi</p>
            <p className="text-2xl font-black text-purple-950 mt-0.5">{docCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${alertCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Peringatan / Alert</p>
            <p className={`text-2xl font-black mt-0.5 ${alertCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{alertCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Content Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {/* Category Pills */}
        <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              categoryFilter === 'ALL'
                ? 'bg-blue-950 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua Aktivitas ({logs.length})
          </button>
          <button
            onClick={() => setCategoryFilter('AUTH')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'AUTH'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Otentikasi / Login ({authCount})
          </button>
          <button
            onClick={() => setCategoryFilter('DOKUMEN')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'DOKUMEN'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Unggahan Berkas
          </button>
          <button
            onClick={() => setCategoryFilter('SUPERVISI')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'SUPERVISI'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Supervisi Akademik
          </button>
          <button
            onClick={() => setCategoryFilter('KBM')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'KBM'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Absensi & Jurnal ({kbmCount})
          </button>
          <button
            onClick={() => setCategoryFilter('SISTEM')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'SISTEM'
                ? 'bg-slate-800 text-white shadow'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Sistem & User
          </button>
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200/80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari user, aksi, deskripsi, IP..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">Semua Role</option>
              <option value="Admin">Admin (Kepsek/Waka)</option>
              <option value="Guru/Tendik">Guru/Tendik</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Status Log:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">Berhasil (SUCCESS)</option>
              <option value="WARNING">Peringatan (WARNING)</option>
              <option value="FAILED">Gagal (FAILED)</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">Waktu & Tanggal</th>
                <th className="p-4 font-semibold">Pengguna & Peran</th>
                <th className="p-4 font-semibold">Aksi & Kategori</th>
                <th className="p-4 font-semibold">Deskripsi Aktivitas</th>
                <th className="p-4 font-semibold">IP & Jaringan</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Tidak ada catatan audit trail yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-gray-900 font-semibold">
                        {new Date(l.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {new Date(l.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${l.userRole === 'Admin' ? 'bg-amber-500' : 'bg-blue-600'}`}></span>
                        {l.userName}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                        {l.userRole}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-xs text-slate-800">
                        {l.action}
                      </div>
                      <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold tracking-wider ${
                        l.category === 'AUTH' ? 'bg-blue-100 text-blue-800' :
                        l.category === 'DOKUMEN' ? 'bg-emerald-100 text-emerald-800' :
                        l.category === 'SUPERVISI' ? 'bg-purple-100 text-purple-800' :
                        l.category === 'ABSENSI' || l.category === 'JURNAL' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {l.category}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        {l.description}
                      </p>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {l.ipAddress}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        l.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        l.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {l.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {l.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {l.status === 'FAILED' && <XCircle className="w-3 h-3 text-red-600" />}
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition"
                        title="Lihat Detail Inspeksi Log"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: EVENT DETAIL INSPECTION */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-gray-900 text-base">Detail Forensik Audit Log</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                <div>
                  <span className="text-gray-400 block font-medium">Log ID:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Status Event:</span>
                  <span className={`font-bold inline-block px-2 py-0.5 rounded text-[11px] ${
                    selectedLog.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    selectedLog.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Pengguna:</span>
                  <span className="font-bold text-gray-900">{selectedLog.userName} ({selectedLog.userRole})</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">IP Address:</span>
                  <span className="font-mono text-gray-700">{selectedLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-semibold block mb-1">Aksi & Deskripsi:</span>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-gray-800 leading-relaxed font-medium">
                  <span className="font-bold text-blue-950 font-mono mr-1">[{selectedLog.action}]</span>
                  {selectedLog.description}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-gray-500 font-semibold block mb-1">Metadata Payload:</span>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-gray-400 text-[11px] pt-1">
                Dicatat otomatis oleh SIAKAD Security Sentinel pada {new Date(selectedLog.timestamp).toLocaleString('id-ID')}.
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM CLEAR AUDIT LOGS */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Reset Riwayat Audit Trail</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengosongkan seluruh riwayat log aktivitas pengguna? Tindakan ini menghapus seluruh riwayat forensik keamanan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Hapus Seluruh Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
