import React, { useEffect, useState } from 'react';
import { Copy, Check, Download, FileSpreadsheet, Code2, Database } from 'lucide-react';

interface SheetStructure {
  name: string;
  columns: string[];
}

export default function GasViewer() {
  const [gasCode, setGasCode] = useState('');
  const [sheetStructures, setSheetStructures] = useState<SheetStructure[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gas-code')
      .then(res => res.json())
      .then(data => {
        setGasCode(data.gasCode);
        setSheetStructures(data.sheetStructures);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([gasCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code.gs';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Memuat skrip Google Apps Script...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-blue-700/60 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Google Apps Script & Sheets Integration
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">Backend Google Sheets & GAS Code</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Berikut adalah skrip backend Google Apps Script (<code className="bg-blue-950/80 px-1.5 py-0.5 rounded text-amber-300">Code.gs</code>) dan struktur lembar kerja Google Sheets yang dirancang khusus untuk SIAKAD SMA Negeri 14 Kota Tidore Kepulauan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg text-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin ke Clipboard!' : 'Salin Kode GAS'}
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg text-sm"
            >
              <Download className="w-4 h-4" />
              Download Code.gs
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Structure Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Struktur Tabel Google Sheets</h2>
            <p className="text-sm text-gray-500">Buat spreadsheet baru dengan nama lembar (sheet) berikut dan header kolom yang sesuai:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheetStructures.map((sheet, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 hover:border-blue-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-blue-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Sheet: {sheet.name}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                  {sheet.columns.length} Kolom
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sheet.columns.map((col, cIdx) => (
                  <span key={cIdx} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded font-mono shadow-2xs">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Apps Script Code Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-mono text-sm">
            <Code2 className="w-5 h-5 text-amber-400" />
            <span>Code.gs - Google Apps Script Editor</span>
          </div>
          <span className="text-xs text-gray-400 font-mono">Apps Script V8 Runtime</span>
        </div>
        <div className="p-4 sm:p-6 bg-gray-950 text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto max-h-[500px] leading-relaxed">
          <pre>{gasCode}</pre>
        </div>
      </div>

      {/* Deployment Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-amber-900 text-base mb-2">Panduan Penerapan Google Apps Script:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
          <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
          <li>Buka menu <span className="font-semibold">Extensions &gt; Apps Script</span>.</li>
          <li>Hapus kode default dan tempelkan (<span className="font-semibold">Paste</span>) kode <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Code.gs</code> di atas.</li>
          <li>Ganti variabel <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">SS_ID</code> dengan ID Google Spreadsheet Anda.</li>
          <li>Buat folder Google Drive untuk penyimpanan file upload dan masukkan ID-nya ke <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">folderId</code>.</li>
          <li>Deploy sebagai <span className="font-semibold">Web App</span> (Execute as: Me, Who has access: Anyone). Salin URL Web App untuk dihubungkan ke frontend jika diperlukan.</li>
        </ol>
      </div>
    </div>
  );
}
