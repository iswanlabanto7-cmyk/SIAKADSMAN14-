import React, { useState, useEffect } from 'react';
import { User, AbsensiRecord, JournalRecord, DocumentRecord, SupervisionRecord, SchoolSettings } from './types';
import LoginScreen from './components/LoginModal';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import GasViewer from './components/GasViewer';

import AuditTrail from './components/AuditTrail';

import { 
  DEFAULT_SETTINGS, DEFAULT_USERS, DEFAULT_DOCUMENTS, 
  DEFAULT_ABSENSI, DEFAULT_JURNAL, DEFAULT_SUPERVISI, 
  getLocal, setLocal 
} from './services/dataService';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('siakad_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Data states with automatic offline/Vercel fallback
  const [users, setUsers] = useState<User[]>(() => getLocal('users', DEFAULT_USERS));
  const [absensi, setAbsensi] = useState<AbsensiRecord[]>(() => getLocal('absensi', DEFAULT_ABSENSI));
  const [jurnal, setJurnal] = useState<JournalRecord[]>(() => getLocal('jurnal', DEFAULT_JURNAL));
  const [dokumen, setDokumen] = useState<DocumentRecord[]>(() => getLocal('dokumen', DEFAULT_DOCUMENTS));
  const [supervisi, setSupervisi] = useState<SupervisionRecord[]>(() => getLocal('supervisi', DEFAULT_SUPERVISI));
  const [settings, setSettings] = useState<SchoolSettings>(() => getLocal('settings', DEFAULT_SETTINGS));

  const fetchData = async () => {
    try {
      const [uRes, aRes, jRes, dRes, sRes, setRes] = await Promise.all([
        fetch('/api/users').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/absensi').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/jurnal').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/dokumen').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/supervisi').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (uRes) { setUsers(uRes); setLocal('users', uRes); }
      if (aRes) { setAbsensi(aRes); setLocal('absensi', aRes); }
      if (jRes) { setJurnal(jRes); setLocal('jurnal', jRes); }
      if (dRes) { setDokumen(dRes); setLocal('dokumen', dRes); }
      if (sRes) { setSupervisi(sRes); setLocal('supervisi', sRes); }
      if (setRes) { setSettings(setRes); setLocal('settings', setRes); }
    } catch (err) {
      console.log('App running in client fallback mode for Vercel/offline');
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('siakad_user', JSON.stringify(loggedInUser));
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await fetch('/api/audit-trail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'LOGOUT',
            category: 'AUTH',
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            description: `Pengguna ${user.name} (${user.role}) keluar (logout) dari sistem`,
            status: 'SUCCESS'
          })
        });
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem('siakad_user');
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 py-8">
        {activeTab === 'gas-viewer' ? (
          <GasViewer />
        ) : activeTab === 'audit-trail' ? (
          <AuditTrail settings={settings} />
        ) : user.role === 'Admin' ? (
          <AdminDashboard
            activeTab={activeTab}
            users={users}
            absensi={absensi}
            jurnal={jurnal}
            dokumen={dokumen}
            supervisi={supervisi}
            settings={settings}
            refreshData={fetchData}
          />
        ) : (
          <TeacherDashboard
            activeTab={activeTab}
            user={user}
            absensi={absensi}
            jurnal={jurnal}
            dokumen={dokumen}
            settings={settings}
            refreshData={fetchData}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-blue-950">SIAKAD SMA Negeri 14 Kota Tidore Kepulauan</p>
        <p className="mt-1">© {new Date().getFullYear()} Dinas Pendidikan Provinsi Maluku Utara • Seluruh Hak Cipta Dilindungi</p>
      </footer>
    </div>
  );
}
