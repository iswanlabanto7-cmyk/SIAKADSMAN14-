import React, { useState, useEffect } from 'react';
import { 
  initGoogleAuth, signInWithGoogle, getGoogleAccessToken, googleLogout, getGoogleUser 
} from '../services/googleAuth';
import { 
  listDriveFiles, createDriveFolder, uploadFileToDrive, deleteDriveFile, getDriveStorageInfo, 
  DriveFileItem, DriveStorageInfo 
} from '../services/googleDrive';
import { User as AppUser, SchoolSettings } from '../types';
import { 
  Folder, FileText, FileSpreadsheet, Presentation, File, Upload, Plus, 
  Trash2, ExternalLink, RefreshCw, Search, LogOut, CheckCircle2, 
  AlertTriangle, HardDrive, ShieldCheck, Download, FolderPlus, ArrowLeft, X
} from 'lucide-react';

interface GoogleDriveExplorerProps {
  currentUser: AppUser;
  settings: SchoolSettings;
  onSyncDocumentToSiakad?: () => void;
}

export default function GoogleDriveExplorer({ 
  currentUser, 
  settings, 
  onSyncDocumentToSiakad 
}: GoogleDriveExplorerProps) {
  // Google Auth States
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<DriveStorageInfo>({});

  // Drive Browsing States
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Folder Navigation
  const [folderHistory, setFolderHistory] = useState<{ id?: string; name: string }[]>([
    { id: undefined, name: 'Google Drive Saya' }
  ]);
  const currentFolder = folderHistory[folderHistory.length - 1];

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<'ATP' | 'PROTA' | 'PROSEM' | 'Modul Ajar' | 'Lainnya'>('Modul Ajar');
  const [syncToSiakad, setSyncToSiakad] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Destructive Confirmation Dialog (MANDATORY per Workspace Integration Skill)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, accessToken) => {
        setToken(accessToken);
        loadDriveData(accessToken, currentFolder.id);
      },
      () => {
        setToken(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadDriveData = async (accessToken: string, folderId?: string) => {
    setLoadingFiles(true);
    try {
      const [fileList, storage] = await Promise.all([
        listDriveFiles(accessToken, folderId, searchQuery, categoryFilter === 'all' ? undefined : categoryFilter),
        getDriveStorageInfo(accessToken)
      ]);
      setFiles(fileList);
      setStorageInfo(storage);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('401') || err.message?.includes('Invalid Credentials')) {
        setToken(null);
        setAuthError('Sesi Google Drive telah berakhir. Silakan login kembali.');
      } else {
        showToast(err.message || 'Gagal memuat berkas Google Drive', 'error');
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setToken(result.accessToken);
        showToast(`Berhasil terhubung dengan Google Drive: ${result.user.email}`);
        loadDriveData(result.accessToken, currentFolder.id);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Gagal melakukan otentikasi Google Drive');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await googleLogout();
    setToken(null);
    setFiles([]);
    setStorageInfo({});
    showToast('Berhasil memutuskan koneksi Google Drive', 'info');
  };

  const handleFolderClick = (folder: DriveFileItem) => {
    const nextHistory = [...folderHistory, { id: folder.id, name: folder.name }];
    setFolderHistory(nextHistory);
    if (token) {
      loadDriveData(token, folder.id);
    }
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const nextHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(nextHistory);
    if (token) {
      loadDriveData(token, nextHistory[nextHistory.length - 1].id);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;
    try {
      await createDriveFolder(token, newFolderName.trim(), currentFolder.id);
      showToast(`Folder "${newFolderName}" berhasil dibuat di Google Drive!`);
      setNewFolderName('');
      setShowFolderModal(false);
      loadDriveData(token, currentFolder.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat folder', 'error');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !uploadFile) return;
    setUploading(true);
    try {
      const driveFile = await uploadFileToDrive(
        token, 
        uploadFile, 
        `Perangkat Ajar (${uploadCategory}) - ${currentUser.name} - SMA Negeri 14 Kota Tidore Kepulauan`,
        currentFolder.id
      );

      // If sync to SIAKAD database is checked
      if (syncToSiakad) {
        await fetch('/api/dokumen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            name: currentUser.name,
            title: uploadFile.name.replace(/\.[^/.]+$/, ""),
            category: uploadCategory,
            fileName: uploadFile.name,
            fileUrl: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
            fileSize: uploadFile.size > 1024 * 1024 ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(uploadFile.size / 1024)} KB`
          })
        });
        if (onSyncDocumentToSiakad) onSyncDocumentToSiakad();
      }

      showToast(`Berkas "${uploadFile.name}" berhasil diunggah ke Google Drive!`);
      setShowUploadModal(false);
      setUploadFile(null);
      loadDriveData(token, currentFolder.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah berkas', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Mandatory Explicit Confirmation for Destructive Action
  const executeDeleteFile = async () => {
    if (!token || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, fileToDelete.id);
      showToast(`Berkas "${fileToDelete.name}" telah dihapus dari Google Drive.`);
      setFileToDelete(null);
      loadDriveData(token, currentFolder.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus berkas', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format File Size
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '-';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-100" />;
    }
    if (mimeType.includes('document') || mimeType === 'application/pdf' || mimeType.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-5 h-5 text-amber-600" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold flex items-center gap-3 transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-800/80 text-blue-200 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-blue-700/60">
                <HardDrive className="w-3.5 h-3.5 text-blue-300" />
                Google Workspace Integration
              </span>
              <span className="text-xs text-blue-300 font-mono">Google Drive API v3</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Penyimpanan Google Drive Sekolah
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Jelajahi, kelola, dan sinkronkan dokumen perangkat ajar (ATP, PROTA, PROSEM, Modul Ajar) langsung dengan akun Google Drive Anda di {settings.schoolName}.
            </p>
          </div>

          {/* Account Status / Sign In Button */}
          {token && storageInfo.user ? (
            <div className="bg-blue-950/80 backdrop-blur-md border border-blue-800/60 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
              {storageInfo.user.photoLink ? (
                <img 
                  src={storageInfo.user.photoLink} 
                  alt={storageInfo.user.displayName} 
                  className="w-10 h-10 rounded-full border-2 border-amber-400" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500 text-blue-950 font-black flex items-center justify-center">
                  {storageInfo.user.displayName?.[0] || 'G'}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {storageInfo.user.displayName}
                </div>
                <div className="text-[11px] text-blue-300 font-mono">
                  {storageInfo.user.emailAddress}
                </div>
                {storageInfo.usage && (
                  <div className="text-[10px] text-amber-300 mt-0.5">
                    Terpakai: {formatBytes(storageInfo.usage)}
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-xl transition ml-1"
                title="Putuskan Hubungan Google Drive"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              {/* Official Google Sign-In Material Button (MANDATORY per Workspace Integration skill) */}
              <button 
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-3 rounded-2xl shadow-lg transition flex items-center gap-3 border border-gray-200 active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                  {isAuthenticating ? 'Menghubungkan...' : 'Masuk dengan Google Drive'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button onClick={() => setAuthError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* If Not Authenticated View */}
      {!token ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <HardDrive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hubungkan Google Drive Anda</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Untuk melihat, mengunggah, dan mengelola berkas perangkat ajar secara langsung dari cloud Google Drive Anda, silakan hubungkan akun Google Workspace atau akun Google pribadi Anda dengan izin yang aman.
            </p>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 text-left space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Keamanan & Privasi Akun:
            </span>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Token akses disimpan secara aman hanya di memori sementara browser (tidak pernah disimpan di local storage).</li>
              <li>Setiap tindakan penghapusan berkas mewajibkan konfirmasi eksplisit dari pengguna.</li>
              <li>Mendukung unggahan langsung ATP, PROTA, PROSEM, dan Modul Ajar ke Drive.</li>
            </ul>
          </div>

          <button 
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="inline-flex items-center gap-3 bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl transition active:scale-95 text-sm"
          >
            <span>{isAuthenticating ? 'Menghubungkan...' : 'Hubungkan Akun Google Drive Sekarang'}</span>
          </button>
        </div>
      ) : (
        /* Authenticated File Explorer View */
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          {/* Top Actions & Breadcrumb */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              {folderHistory.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => handleNavigateBreadcrumb(idx)}
                    className={`hover:text-blue-900 transition px-2 py-1 rounded-lg ${
                      idx === folderHistory.length - 1 ? 'bg-blue-50 text-blue-950 font-bold' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Folder & Upload Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
              <button
                onClick={() => loadDriveData(token, currentFolder.id)}
                disabled={loadingFiles}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                title="Refresh Folder"
              >
                <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowFolderModal(true)}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition"
              >
                <FolderPlus className="w-4 h-4 text-gray-600" />
                Folder Baru
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload ke Drive
              </button>
            </div>
          </div>

          {/* Search & File Type Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadDriveData(token, currentFolder.id); }}
                placeholder="Cari berkas di Google Drive..."
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Tipe Berkas:</span>
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setTimeout(() => loadDriveData(token, currentFolder.id), 50);
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="all">Semua Tipe Berkas</option>
                <option value="folders">Folder Saja</option>
                <option value="documents">Dokumen & PDF</option>
                <option value="spreadsheets">Spreadsheet / Excel</option>
                <option value="presentations">Presentasi / PPT</option>
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-end text-xs text-gray-500 font-mono pr-2">
              <span>{files.length} Berkas Ditemukan</span>
            </div>
          </div>

          {/* Files Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="p-4 font-semibold">Nama Berkas / Folder</th>
                  <th className="p-4 font-semibold">Tipe</th>
                  <th className="p-4 font-semibold">Ukuran</th>
                  <th className="p-4 font-semibold">Terakhir Diubah</th>
                  <th className="p-4 font-semibold text-center">Aksi Google Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loadingFiles ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-900" />
                      Memuat berkas dari Google Drive...
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      Tidak ada berkas atau folder pada direktori ini.
                    </td>
                  </tr>
                ) : (
                  files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    return (
                      <tr key={file.id} className="hover:bg-blue-50/40 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.mimeType)}
                            {isFolder ? (
                              <button
                                onClick={() => handleFolderClick(file)}
                                className="font-bold text-gray-900 hover:text-blue-900 text-left transition truncate max-w-md"
                              >
                                {file.name}
                              </button>
                            ) : (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-gray-800 hover:text-blue-900 transition truncate max-w-md"
                              >
                                {file.name}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-gray-500">
                          {isFolder ? 'Folder' : file.mimeType.split('.').pop()?.split('/').pop() || 'File'}
                        </td>
                        <td className="p-4 text-xs font-mono text-gray-600">
                          {formatBytes(file.size)}
                        </td>
                        <td className="p-4 text-xs font-mono text-gray-500">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                title="Buka di Google Drive"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {file.webContentLink && (
                              <a
                                href={file.webContentLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                                title="Unduh Berkas"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            {/* Delete Trigger - Mandates confirmation dialog */}
                            <button
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                              title="Hapus dari Google Drive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE FOLDER */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Buat Folder Baru di Google Drive</h3>
            <p className="text-xs text-gray-500 mb-4">
              Folder akan dibuat di: <strong>{currentFolder.name}</strong>
            </p>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Contoh: Perangkat Ajar Matematika 2025"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD FILE TO DRIVE */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upload Berkas ke Google Drive</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Pilih Berkas</label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm bg-gray-50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Kategori Perangkat Ajar</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="ATP">ATP (Alur Tujuan Pembelajaran)</option>
                  <option value="PROTA">PROTA (Program Tahunan)</option>
                  <option value="PROSEM">PROSEM (Program Semester)</option>
                  <option value="Modul Ajar">Modul Ajar (Kurikulum Merdeka)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="syncCheck"
                  checked={syncToSiakad}
                  onChange={e => setSyncToSiakad(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded"
                />
                <label htmlFor="syncCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Katalogkan otomatis ke tabel Supervisi Perangkat Ajar SIAKAD
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Mengunggah...' : 'Upload Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXPLICIT CONFIRMATION DIALOG FOR DESTRUCTIVE ACTIONS (MANDATORY PER WORKSPACE INTEGRATION SKILL) */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus Berkas Google Drive</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus berkas berikut dari Google Drive Anda? Tindakan ini akan memindahkan berkas ke folder sampah (trash) Google Drive.
            </p>

            <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl mb-6 text-xs text-red-950 font-medium">
              <div className="font-bold truncate">{fileToDelete.name}</div>
              <div className="text-[11px] text-red-700 font-mono mt-0.5">ID: {fileToDelete.id}</div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteFile}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Menghapus...' : 'Konfirmasi Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
