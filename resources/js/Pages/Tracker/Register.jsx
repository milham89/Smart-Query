import React, { useState } from 'react';
import { Archive, Clock, BookOpen, CheckCircle, List, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const tabs = [
    { key: 'dipinjam', label: 'Sedang Dipinjam', icon: BookOpen, color: 'red' },
    { key: 'dikembalikan', label: 'Sudah Dikembalikan', icon: CheckCircle, color: 'emerald' },
    { key: 'semua', label: 'Semua', icon: List, color: 'blue' },
];

function formatDate(d) {
    if (!d) return '-';
    // Support 'YYYY-MM-DD HH:mm:ss' or ISO string
    const s = String(d).replace(' ', 'T');
    const date = new Date(s);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

export default function Register({ records, filter, search: initialSearch }) {
    const [searchVal, setSearchVal] = useState(initialSearch || '');
    const [clock, setClock] = useState(new Date());
    const [deletingId, setDeletingId] = useState(null);

    React.useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

    const handleDelete = async (id, noRegister) => {
        if (!window.confirm(`Yakin ingin menghapus riwayat peminjaman dengan No. Register "${noRegister}"?`)) {
            return;
        }

        setDeletingId(id);
        try {
            const res = await fetch(`/register/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await res.json();
            if (res.ok) {
                // Refresh page
                navigate({ filter, search: searchVal });
            } else {
                alert(data.message || 'Gagal menghapus data register.');
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi saat menghapus data.');
        } finally {
            setDeletingId(null);
        }
    };

    const navigate = (params) => {
        const url = new URL(window.location.origin + '/register');
        Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
        window.location.href = url.toString();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        navigate({ filter, search: searchVal });
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
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">Register Peminjaman</h1>
                        <p className="text-xs text-slate-500">Riwayat peminjaman dan pengembalian arsip</p>
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

            <main className="flex-1 p-6 max-w-screen-xl mx-auto w-full space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = filter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => navigate({ filter: tab.key, search: searchVal })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    active
                                        ? `bg-${tab.color}-600 text-white shadow`
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                                style={active ? { backgroundColor: tab.color === 'red' ? '#dc2626' : tab.color === 'emerald' ? '#059669' : '#2563eb' } : {}}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}

                    {/* Search */}
                    <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
                        <input
                            type="text"
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                            placeholder="Cari kode/nama/register..."
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                        />
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
                            <Search size={16} />
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">No. Register</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Kode Pelaksana</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Pemohon</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Identitas Arsip</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tgl Pinjam</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tgl Kembali</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                        Tidak ada data.
                                    </td>
                                </tr>
                            ) : (
                                records.data.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs">{r.no_register}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{r.kode_pelaksana}</td>
                                        <td className="px-4 py-3">{r.nama_pemohon}</td>
                                        <td className="px-4 py-3 max-w-xs truncate" title={r.identitas_arsip}>{r.identitas_arsip}</td>
                                        <td className="px-4 py-3 text-xs">{formatDate(r.tanggal_request)}</td>
                                        <td className="px-4 py-3 text-xs">{r.tgl_pengembalian ? formatDate(r.tgl_pengembalian) : '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {r.tgl_pengembalian ? (
                                                <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">DIKEMBALIKAN</span>
                                            ) : (
                                                <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">DIPINJAM</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(r.id, r.no_register)}
                                                disabled={deletingId === r.id}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                title="Hapus Register"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {records.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Menampilkan {records.from}–{records.to} dari {records.total} data
                        </span>
                        <div className="flex items-center gap-1">
                            {records.links.map((link, i) => {
                                if (!link.url) return null;
                                // Parse page from link.url
                                const url = new URL(link.url);
                                const page = url.searchParams.get('page');
                                return (
                                    <button
                                        key={i}
                                        onClick={() => navigate({ filter, search: searchVal, page })}
                                        className={`px-3 py-1.5 rounded text-sm ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
