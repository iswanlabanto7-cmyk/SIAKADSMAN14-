import React, { useState } from 'react';
import { User, AbsensiRecord, JournalRecord, DocumentRecord, SchoolSettings } from '../types';
import { CheckCircle2, Clock, FileText, Upload, Sparkles, BookOpen, Calendar, Send, Check } from 'lucide-react';

interface TeacherDashboardProps {
  activeTab: string;
  user: User;
  absensi: AbsensiRecord[];
  jurnal: JournalRecord[];
  dokumen: DocumentRecord[];
  settings: SchoolSettings;
  refreshData: () => void;
}

export default function TeacherDashboard({
  activeTab,
  user,
  absensi,
  jurnal,
  dokumen,
  settings,
  refreshData
}: TeacherDashboardProps) {
  // Absensi form state
  const [absensiStatus, setAbsensiStatus] = useState<'Hadir' | 'Sakit' | 'Izin'>('Hadir');
  const [absensiNotes, setAbsensiNotes] = useState('Tepat waktu');
  const [absensiSuccess, setAbsensiSuccess] = useState(false);

  // Jurnal form state
  const [jurnalForm, setJurnalForm] = useState({ subject: user.subject || '', classRoom: 'XII IPA 1', material: '', notes: '' });
  const [jurnalSuccess, setJurnalSuccess] = useState(false);

  // Upload document form state
  const [docForm, setDocForm] = useState({ title: '', category: 'ATP' as any, fileName: '', fileUrl: '', fileSize: '500 KB' });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // AI RPP Generator state
  const [aiForm, setAiForm] = useState({ subject: user.subject || 'Matematika', grade: 'Kelas XII', topic: '', objective: '' });
  const [aiResult, setAiResult] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAbsensiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/absensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, name: user.name, status: absensiStatus, notes: absensiNotes })
    });
    setAbsensiSuccess(true);
    setTimeout(() => setAbsensiSuccess(false), 3000);
    refreshData();
  };

  const handleJurnalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/jurnal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, name: user.name, ...jurnalForm })
    });
    setJurnalSuccess(true);
    setJurnalForm({ subject: user.subject || '', classRoom: 'XII IPA 1', material: '', notes: '' });
    setTimeout(() => setJurnalSuccess(false), 3000);
    refreshData();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/dokumen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: user.name,
        title: docForm.title,
        category: docForm.category,
        fileName: docForm.fileName || `${docForm.category}_${user.name.split(' ')[0]}_SMA14.pdf`,
        fileUrl: docForm.fileUrl || `https://drive.google.com/file/d/sman14_tidore_${Date.now()}/view`,
        fileSize: docForm.fileSize || '850 KB'
      })
    });
    setUploadSuccess(true);
    setDocForm({ title: '', category: 'ATP', fileName: '', fileUrl: '', fileSize: '500 KB' });
    setTimeout(() => setUploadSuccess(false), 3000);
    refreshData();
  };

  const handleGenerateAiRpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/generate-rpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm)
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const myAbsensi = absensi.filter(a => a.userId === user.id);
  const myJurnal = jurnal.filter(j => j.userId === user.id);
  const myDokumen = dokumen.filter(d => d.userId === user.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* 1. DASHBOR GURU TAB */}
      {activeTab === 'dashboard' && (
        <>
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <span className="bg-amber-500 text-blue-950 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Dasbor Guru & Tenaga Kependidikan
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-3">
              Halo, {user.name}
            </h2>
            <p className="text-blue-100 text-sm mt-2 max-w-2xl leading-relaxed">
              Mata Pelajaran: <span className="font-semibold text-amber-300">{user.subject || 'Guru Umum'}</span> • {settings.schoolName}. Silakan lakukan absensi harian dan catat jurnal mengajar Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Kehadiran Tercatat</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{myAbsensi.length} Hari</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Jurnal Mengajar</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{myJurnal.length} Sesi</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Perangkat Ajar</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{myDokumen.length} Berkas</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. ABSENSI HARIAN TAB */}
      {activeTab === 'absensi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Form Absensi Harian Guru</h2>
            <p className="text-sm text-gray-500 mb-6">Lakukan absensi kehadiran Anda setiap hari kerja.</p>

            {absensiSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Absensi berhasil disimpan ke sistem!
              </div>
            )}

            <form onSubmit={handleAbsensiSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status Kehadiran</label>
                <select
                  value={absensiStatus}
                  onChange={e => setAbsensiStatus(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Hadir">Hadir (Masuk Tepat Waktu)</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin (Dinas Luar / Keperluan Penting)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={absensiNotes}
                  onChange={e => setAbsensiNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition shadow"
              >
                Kirim Absensi Hari Ini
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Riwayat Kehadiran Saya</h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {myAbsensi.map(a => (
                <div key={a.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{a.date} • <span className="text-xs font-mono text-gray-500">{a.time}</span></div>
                    <div className="text-xs text-gray-600 mt-0.5">{a.notes}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                    a.status === 'Izin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. JURNAL MENGAJAR TAB */}
      {activeTab === 'jurnal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Isi Jurnal Mengajar Harian</h2>
            <p className="text-sm text-gray-500 mb-6">Catat kegiatan KBM, materi pembelajaran, dan catatan kelas.</p>

            {jurnalSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Jurnal mengajar berhasil disimpan!
              </div>
            )}

            <form onSubmit={handleJurnalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={jurnalForm.subject}
                  onChange={e => setJurnalForm({ ...jurnalForm, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kelas</label>
                <select
                  value={jurnalForm.classRoom}
                  onChange={e => setJurnalForm({ ...jurnalForm, classRoom: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="X MIPA">X MIPA</option>
                  <option value="X IPS">X IPS</option>
                  <option value="XI MIPA 1">XI MIPA 1</option>
                  <option value="XI IPS 2">XI IPS 2</option>
                  <option value="XII IPA 1">XII IPA 1</option>
                  <option value="XII IPS 1">XII IPS 1</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Materi Pembelajaran</label>
                <input
                  type="text"
                  value={jurnalForm.material}
                  onChange={e => setJurnalForm({ ...jurnalForm, material: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Catatan / Keaktifan Siswa</label>
                <textarea
                  value={jurnalForm.notes}
                  onChange={e => setJurnalForm({ ...jurnalForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  rows={3}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition shadow"
              >
                Simpan Jurnal Mengajar
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Riwayat Jurnal Mengajar Saya</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {myJurnal.map(j => (
                <div key={j.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-gray-900">{j.subject} • {j.classRoom}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">{j.date}</span>
                  </div>
                  <p className="text-xs text-blue-900 font-semibold mt-1">Materi: {j.material}</p>
                  <p className="text-xs text-gray-600 mt-1 italic">"{j.notes}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. UPLOAD PERANGKAT AJAR TAB */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Perangkat Ajar ke Google Drive</h2>
            <p className="text-sm text-gray-500 mb-6">Unggah RPP, Modul Ajar, Silabus, atau Prota (.pdf / .docx).</p>

            {uploadSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Dokumen perangkat ajar berhasil diunggah!
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Judul Dokumen</label>
                <input
                  type="text"
                  value={docForm.title}
                  onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="Contoh: Modul Ajar Trigonometri Kelas X"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kategori Dokumen</label>
                <select
                  value={docForm.category}
                  onChange={e => setDocForm({ ...docForm, category: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="ATP">ATP (Alur Tujuan Pembelajaran)</option>
                  <option value="PROTA">PROTA (Program Tahunan)</option>
                  <option value="PROSEM">PROSEM (Program Semester)</option>
                  <option value="Modul Ajar">Modul Ajar (Kurikulum Merdeka)</option>
                  <option value="Silabus">Silabus</option>
                  <option value="RPP">RPP (Rencana Pelaksanaan Pembelajaran)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">File Dokumen (PDF, Word, Excel)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const sizeFormatted = file.size > 1024 * 1024 
                        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                        : `${Math.round(file.size / 1024)} KB`;
                      setDocForm({ 
                        ...docForm, 
                        fileName: file.name,
                        fileSize: sizeFormatted
                      });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm bg-gray-50 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Format didukung: PDF, DOCX, XLSX. Berkas akan otomatis tersimpan ke Google Drive sekolah.</p>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload ke Google Drive & Sheets
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Daftar Dokumen Saya</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {myDokumen.map(d => (
                <div key={d.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{d.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{d.category} • {d.uploadDate}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    d.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' :
                    d.status === 'Revisi' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. AI ASISTEN RPP TAB */}
      {activeTab === 'ai-lesson' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 max-w-4xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold mb-1">
              <Sparkles className="w-5 h-5" />
              <span>Gemini AI Kurikulum Merdeka Lesson Plan Assistant</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Buat Modul Ajar / RPP Instan</h2>
            <p className="text-sm text-gray-500">Gunakan kecerdasan buatan Gemini untuk menyusun Modul Ajar yang sesuai dengan standar Kurikulum Merdeka.</p>
          </div>

          <form onSubmit={handleGenerateAiRpp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={aiForm.subject}
                  onChange={e => setAiForm({ ...aiForm, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kelas & Fase</label>
                <input
                  type="text"
                  value={aiForm.grade}
                  onChange={e => setAiForm({ ...aiForm, grade: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Topik / Bab Pembelajaran</label>
              <input
                type="text"
                value={aiForm.topic}
                onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                placeholder="Contoh: Hukum Newton tentang Gerak"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tujuan Pembelajaran Utama</label>
              <input
                type="text"
                value={aiForm.objective}
                onChange={e => setAiForm({ ...aiForm, objective: e.target.value })}
                placeholder="Contoh: Siswa dapat menganalisis gaya gesek pada bidang miring"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loadingAi}
              className="w-full bg-amber-500 hover:bg-amber-400 text-blue-950 font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {loadingAi ? 'Sedang Menyusun Modul Ajar...' : 'Buat Modul Ajar dengan Gemini AI'}
            </button>
          </form>

          {aiResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mt-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="font-bold text-gray-900">Hasil Modul Ajar Kurikulum Merdeka</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(aiResult)}
                  className="text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-800"
                >
                  Salin Teks
                </button>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-mono bg-white p-4 rounded-xl border border-gray-200">
                {aiResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
