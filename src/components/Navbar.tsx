import React from 'react';
import { User } from '../types';
import { GraduationCap, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ user, onLogout, activeTab, setActiveTab }: NavbarProps) {
  const isAdmin = user.role === 'Admin';

  return (
    <header className="bg-blue-950 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* School Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg text-blue-950 font-black text-xl">
              14
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">SIAKAD Sekolah</span>
                <span className="bg-blue-900 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-mono">NPSN: 69988123</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                SMA Negeri 14 Kota Tidore Kepulauan
              </h1>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-bold text-sm text-white">{user.name}</span>
              <span className="text-xs text-blue-300 flex items-center justify-end gap-1">
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {user.role} {user.subject ? `• ${user.subject}` : ''}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition shadow-md"
              title="Keluar dari Aplikasi"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-2 border-t border-blue-900/80 py-2 scrollbar-none">
          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Dasbor Utama
              </button>
              <button
                onClick={() => setActiveTab('supervisi')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'supervisi' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Supervisi Akademik
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'users' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Manajemen Pengguna
              </button>
              <button
                onClick={() => setActiveTab('absensi')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'absensi' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Pratinjau Kehadiran
              </button>
              <button
                onClick={() => setActiveTab('dokumen')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'dokumen' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Dokumen & Perangkat Ajar
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Pengaturan Sekolah
              </button>
              <button
                onClick={() => setActiveTab('audit-trail')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'audit-trail' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-amber-300 hover:bg-blue-900/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Audit Trail (Log)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Dasbor Guru
              </button>
              <button
                onClick={() => setActiveTab('absensi')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'absensi' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Absensi Harian
              </button>
              <button
                onClick={() => setActiveTab('jurnal')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'jurnal' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Jurnal Mengajar
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'upload' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                Upload Perangkat Ajar
              </button>
              <button
                onClick={() => setActiveTab('ai-lesson')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === 'ai-lesson' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                ✨ AI Asisten RPP
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('gas-viewer')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gas-viewer' ? 'bg-emerald-500 text-white font-bold shadow' : 'text-emerald-300 hover:bg-blue-900/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Google Apps Script & Sheets
          </button>
        </div>
      </div>
    </header>
  );
}
