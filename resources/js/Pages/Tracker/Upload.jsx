import React, { useState, useRef } from 'react';
import { Archive, Clock, Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function Upload() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [clock, setClock] = useState(new Date());
    const inputRef = useRef(null);

    React.useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
            setFile(f);
            setResult(null);
            setError(null);
        } else {
            setError('Hanya file .xlsx atau .xls yang didukung.');
        }
    };

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: formData,
            });
            if (res.status === 413) {
                throw new Error('Ukuran file terlalu besar (413 Request Entity Too Large). Pastikan konfigurasi web server / PHP mengizinkan upload file berukuran besar.');
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload gagal');
            setResult(data);
            setFile(null);
            if (inputRef.current) inputRef.current.value = '';
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Archive size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">Upload Data Arsip</h1>
                        <p className="text-xs text-slate-500">Import data arsip dari file Excel</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">← Kembali ke Tracker</a>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
                        <Clock size={16} />
                        <span className="font-mono text-sm font-medium">
                            {clock.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            {' — '}
                            {clock.toLocaleTimeString('id-ID')}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 flex items-start justify-center">
                <div className="w-full max-w-xl space-y-4">
                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`bg-white rounded-xl shadow-sm border-2 border-dashed p-12 text-center cursor-pointer transition ${
                            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
                        }`}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <FileSpreadsheet size={48} className="mx-auto text-slate-300 mb-3" />
                        {file ? (
                            <>
                                <p className="text-slate-700 font-medium">{file.name}</p>
                                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — Klik upload untuk memproses</p>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-500 font-medium">Drag & drop file Excel di sini</p>
                                <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file (.xlsx / .xls)</p>
                            </>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader size={16} className="animate-spin" /> Memproses...</>
                        ) : (
                            <><UploadIcon size={16} /> Upload & Import</>
                        )}
                    </button>

                    {/* Result */}
                    {result && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-emerald-800 font-medium text-sm">{result.message}</p>
                                <p className="text-emerald-600 text-xs mt-1">
                                    Data baru: {result.imported} | Duplikat dilewati: {result.skipped}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-sm text-slate-600 space-y-2">
                        <h3 className="font-semibold text-slate-700">Petunjuk Upload</h3>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>File harus berformat <strong>.xlsx</strong> atau <strong>.xls</strong></li>
                            <li>Format kolom harus sesuai template standar (3 baris header)</li>
                            <li>Data duplikat (kode pelaksana sama) akan otomatis dilewati</li>
                            <li>Maksimal ukuran file: 10 MB</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
