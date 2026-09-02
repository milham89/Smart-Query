import React, { useState, useRef } from 'react';
import { Archive, Clock, Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, Loader, X, FileText } from 'lucide-react';

export default function Upload() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
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

    const addFiles = (newFilesList) => {
        const validFiles = Array.from(newFilesList).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
        if (validFiles.length === 0) {
            setError('Hanya file .xlsx atau .xls yang didukung.');
            return;
        }
        setFiles(prev => {
            const existingNames = new Set(prev.map(p => p.name + p.size));
            const filtered = validFiles.filter(f => !existingNames.has(f.name + f.size));
            return [...prev, ...filtered];
        });
        setResult(null);
        setError(null);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    };

    const uploadSingleFile = (fileObj, index, totalFiles) => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', fileObj);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload', true);
            xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setStatusText(`Mengunggah file ${index + 1} dari ${totalFiles}: ${fileObj.name} (${percent}%)...`);
                    const overallPercent = Math.round(((index + (percent / 100)) / totalFiles) * 100);
                    setUploadProgress(overallPercent);
                }
            };

            xhr.onload = () => {
                const contentType = xhr.getResponseHeader('content-type') || '';
                let data = null;
                if (contentType.includes('application/json')) {
                    try { data = JSON.parse(xhr.responseText); } catch (e) {}
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data || { imported: 0 });
                } else {
                    if (xhr.status === 413) {
                        reject(new Error(`File "${fileObj.name}" terlalu besar (413 Request Entity Too Large). Periksa client_max_body_size pada server.`));
                    } else if (xhr.status === 504) {
                        reject(new Error(`File "${fileObj.name}" timeout saat diproses (504 Gateway Time-out).`));
                    } else if (data && data.message) {
                        reject(new Error(data.message));
                    } else {
                        reject(new Error(`Gagal upload "${fileObj.name}" (${xhr.status}): ${xhr.responseText.slice(0, 100)}`));
                    }
                }
            };

            xhr.onerror = () => reject(new Error(`Koneksi terputus saat mengunggah "${fileObj.name}".`));
            xhr.send(formData);
        });
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setLoading(true);
        setUploadProgress(0);
        setResult(null);
        setError(null);

        let totalImported = 0;
        let successCount = 0;

        try {
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                setStatusText(`Mengunggah file ${i + 1} dari ${files.length}: ${f.name}...`);
                const res = await uploadSingleFile(f, i, files.length);
                totalImported += (res.imported || 0);
                successCount++;
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }

            setLoading(false);
            setResult({
                message: `Berhasil mengimport ${totalImported} data arsip dari ${successCount} file.`,
                imported: totalImported
            });
            setFiles([]);
            if (inputRef.current) inputRef.current.value = '';
        } catch (err) {
            setLoading(false);
            setError(err.message || 'Terjadi kesalahan saat memproses upload.');
        }
    };

    const totalSizeKb = files.reduce((acc, f) => acc + (f.size / 1024), 0);

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
                        <p className="text-xs text-slate-500">Import data arsip dari satu atau beberapa file Excel</p>
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
                        className={`bg-white rounded-xl shadow-sm border-2 border-dashed p-8 text-center cursor-pointer transition ${
                            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
                        }`}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <FileSpreadsheet size={44} className="mx-auto text-blue-500 mb-2 opacity-80" />
                        <p className="text-slate-700 font-medium text-sm">Drag & drop beberapa file Excel di sini</p>
                        <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file (bisa pilih banyak file sekaligus)</p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b pb-2">
                                <span>File Terpilih ({files.length} file)</span>
                                <span>Total: {totalSizeKb > 1024 ? `${(totalSizeKb / 1024).toFixed(2)} MB` : `${totalSizeKb.toFixed(1)} KB`}</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {files.map((f, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs">
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            <FileText size={16} className="text-blue-600 flex-shrink-0" />
                                            <span className="truncate font-medium text-slate-700">{f.name}</span>
                                            <span className="text-slate-400 flex-shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload Button & Progress */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>{statusText}</span>
                                <span>{uploadProgress}%</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? (
                            <><Loader size={16} className="animate-spin" /> Memproses {files.length} File...</>
                        ) : (
                            <><UploadIcon size={16} /> Upload & Import {files.length > 0 ? `(${files.length} File)` : ''}</>
                        )}
                    </button>

                    {/* Result */}
                    {result && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-emerald-800 font-medium text-sm">{result.message}</p>
                                {result.imported !== undefined && (
                                    <p className="text-emerald-600 text-xs mt-1">
                                        Data berhasil diimport: {result.imported} data
                                    </p>
                                )}
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
                            <li>Bisa memilih dan mengupload <strong>lebih dari satu file Excel sekaligus</strong> (multi-file).</li>
                            <li>File harus berformat <strong>.xlsx</strong> atau <strong>.xls</strong>.</li>
                            <li>Sistem otomatis menggabungkan seluruh file dan melakukan batch upsert ke database.</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
