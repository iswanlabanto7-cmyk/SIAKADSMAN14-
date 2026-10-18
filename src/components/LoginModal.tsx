import React, { useState } from 'react';
import { User } from '../types';
import { GraduationCap, ShieldCheck, UserCheck, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, presetUser?: string, presetPass?: string) => {
    if (e) e.preventDefault();
    const u = presetUser || username;
    const p = presetPass || password;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-900/20">
        {/* Header */}
        <div className="bg-blue-950 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 text-blue-950 rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-xl mb-4">
            14
          </div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Sistem Informasi Akademik</span>
          <h1 className="text-2xl font-black mt-1">SMA Negeri 14</h1>
          <p className="text-xs text-blue-200 mt-0.5">Kota Tidore Kepulauan, Maluku Utara</p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={e => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Username / NIP</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Memproses...' : 'Masuk ke Aplikasi'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Presets for Easy Evaluation */}
          <div className="border-t border-gray-100 pt-6 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase text-center tracking-wider">Login Cepat (Demo Akun)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLogin(undefined, 'admin', 'admin123')}
                className="flex items-center justify-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Login Admin (Kepsek)
              </button>
              <button
                onClick={() => handleLogin(undefined, 'budi', 'guru123')}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                Login Guru (Budi)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
