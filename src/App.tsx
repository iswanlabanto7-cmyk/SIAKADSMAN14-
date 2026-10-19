import React, { useState, useEffect } from 'react';
import { User, AbsensiRecord, JournalRecord, DocumentRecord, SupervisionRecord, SchoolSettings } from './types';
import LoginScreen from './components/LoginModal';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import GasViewer from './components/GasViewer';

import AuditTrail from './components/AuditTrail';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('siakad_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [absensi, setAbsensi] = useState<AbsensiRecord[]>([]);
  const [jurnal, setJurnal] = useState<JournalRecord[]>([]);
  const [dokumen, setDokumen] = useState<DocumentRecord[]>([]);
  const [supervisi, setSupervisi] = useState<SupervisionRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: "SMA Negeri 14 Kota Tidore Kepulauan",
    npsn: "69988123",
    address: "Jl. Lintas Tidore - Sofifi, Kelurahan Guraping, Kec. Oba Utara, Kota Tidore Kepulauan",
    principalName: "Drs. H. Abdullah Mahmud, M.Pd.",
    academicYear: "2025/2026",
    semester: "Ganjil"
  });

  const fetchData = async () => {
    try {
      const [uRes, aRes, jRes, dRes, sRes, setRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/absensi').then(r => r.json()),
        fetch('/api/jurnal').then(r => r.json()),
        fetch('/api/dokumen').then(r => r.json()),
        fetch('/api/supervisi').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
      ]);

      setUsers(uRes);
      setAbsensi(aRes);
      setJurnal(jRes);
      setDokumen(dRes);
      setSupervisi(sRes);
      setSettings(setRes);
    } catch (err) {
      console.error('Error fetching data:', err);
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
