import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookOpen, RotateCcw, X, Clock, Archive } from 'lucide-react';
import SearchResultCard from './Components/SearchResultCard';
import ConfirmModal from './Components/ConfirmModal';

export default function Index() {
    const [kodePelaksana, setKodePelaksana] = useState('');
    const [noBoks, setNoBoks] = useState('');
    const [namaPeminjam, setNamaPeminjam] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null); // { type: 'borrow'|'return', arsip }
    const [clock, setClock] = useState(new Date());
    const kodeRef = useRef(null);

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Auto-focus kode_pelaksana
    useEffect(() => { kodeRef.current?.focus(); }, []);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
        || document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '';

    const apiFetch = async (url, body) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
        return data;
    };

    const handleSearch = async () => {
        if (!kodePelaksana && !noBoks) return;
        setLoading(true);
        try {
            const data = await apiFetch('/tracker/search', {
                kode_pelaksana: kodePelaksana,
                no_boks: noBoks,
            });
            setResults(data.results || []);
            if ((data.results || []).length === 0) showToast('Arsip tidak ditemukan.', 'warning');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Barcode scanner: Enter triggers search
    const handleKodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleBorrow = async () => {
        if (!kodePelaksana || !namaPeminjam) {
            showToast('Kode Pelaksana dan Nama Peminjam wajib diisi.', 'error');
            return;
        }
        setModal({ type: 'borrow' });
    };

    const handleReturn = async () => {
        if (!kodePelaksana || !namaPeminjam) {
            showToast('Kode Pelaksana dan Nama Peminjam wajib diisi.', 'error');
            return;
        }
        setModal({ type: 'return' });
    };

    const confirmAction = async () => {
        const type = modal.type;
        setModal(null);
        setLoading(true);
        try {
            const url = type === 'borrow' ? '/tracker/borrow' : '/tracker/return';
            const data = await apiFetch(url, {
                kode_pelaksana: kodePelaksana,
                nama_peminjam: namaPeminjam,
            });
            showToast(data.message, 'success');
            // Refresh search results
            if (data.arsip) {
                setResults(prev => prev.map(r =>
                    r.kode_pelaksana === data.arsip.kode_pelaksana ? data.arsip : r
                ));
            }
            // Play audio feedback
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = type === 'borrow' ? 600 : 800;
                gain.gain.value = 0.1;
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } catch (_) {}
        } catch (e) {
            showToast(e.message, 'error');
            // Error beep
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 300;
                osc.type = 'square';
                gain.gain.value = 0.1;
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } catch (_) {}
        } finally {
            setLoading(false);
            kodeRef.current?.focus();
        }
    };

    const handleReset = () => {
        setKodePelaksana('');
        setNoBoks('');
        setNamaPeminjam('');
        setResults([]);
        kodeRef.current?.focus();
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
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">Smart Query Archive Tracker</h1>
                        <p className="text-xs text-slate-500">Record Center — Sistem Pelacak Arsip</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
                    <Clock size={16} />
                    <span className="font-mono text-sm font-medium">
                        {clock.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {' — '}
                        {clock.toLocaleTimeString('id-ID')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <a href="/register" className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium transition">📋 Register</a>
                    <a href="/upload" className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium transition">📤 Upload</a>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 flex gap-6 max-w-screen-2xl mx-auto w-full">
                {/* Left Panel: Input Form */}
                <div className="w-96 flex-shrink-0 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Form Pencarian & Transaksi</h2>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Kode Pelaksana</label>
                            <input
                                ref={kodeRef}
                                type="text"
                                value={kodePelaksana}
                                onChange={e => setKodePelaksana(e.target.value)}
                                onKeyDown={handleKodeKeyDown}
                                placeholder="Scan barcode atau ketik kode..."
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">No. Boks</label>
                            <input
                                type="text"
                                value={noBoks}
                                onChange={e => setNoBoks(e.target.value)}
                                placeholder="Nomor boks arsip..."
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Nama Peminjam</label>
                            <input
                                type="text"
                                value={namaPeminjam}
                                onChange={e => setNamaPeminjam(e.target.value)}
                                placeholder="Nama pemohon pinjam..."
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                autoComplete="off"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
                            >
                                <Search size={16} /> Cari
                            </button>
                            <button
                                onClick={handleBorrow}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
                            >
                                <BookOpen size={16} /> Pinjam
                            </button>
                            <button
                                onClick={handleReturn}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
                            >
                                <RotateCcw size={16} /> Kembali
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition"
                            >
                                <X size={16} /> Reset
                            </button>
                        </div>
                    </div>

                    {/* Loading indicator */}
                    {loading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center text-sm text-blue-700 font-medium animate-pulse">
                            Sedang Memproses...
                        </div>
                    )}
                </div>

                {/* Right Panel: Results */}
                <div className="flex-1 space-y-3 overflow-auto">
                    {results.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <Archive size={48} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-400 text-sm">Hasil pencarian akan ditampilkan di sini.</p>
                            <p className="text-slate-300 text-xs mt-1">Scan barcode atau masukkan kode pelaksana untuk memulai.</p>
                        </div>
                    ) : (
                        results.map(arsip => (
                            <SearchResultCard key={arsip.id} arsip={arsip} />
                        ))
                    )}
                </div>
            </main>

            {/* Confirm Modal */}
            {modal && (
                <ConfirmModal
                    type={modal.type}
                    kodePelaksana={kodePelaksana}
                    namaPeminjam={namaPeminjam}
                    onConfirm={confirmAction}
                    onCancel={() => setModal(null)}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white z-50 transition-all ${
                    toast.type === 'success' ? 'bg-emerald-600' :
                    toast.type === 'error' ? 'bg-red-600' :
                    'bg-amber-500'
                }`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
