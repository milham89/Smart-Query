import React from 'react';
import { AlertTriangle, BookOpen, RotateCcw } from 'lucide-react';

export default function ConfirmModal({ type, kodePelaksana, namaPeminjam, onConfirm, onCancel }) {
    const isBorrow = type === 'borrow';

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isBorrow ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {isBorrow ? <BookOpen size={20} /> : <RotateCcw size={20} />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                        Konfirmasi {isBorrow ? 'Peminjaman' : 'Pengembalian'}
                    </h3>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Kode Pelaksana</span>
                        <span className="font-mono font-bold text-slate-800">{kodePelaksana}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Nama Peminjam</span>
                        <span className="font-medium text-slate-800">{namaPeminjam}</span>
                    </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>
                        {isBorrow
                            ? 'Arsip akan ditandai sebagai DIPINJAM dan tercatat di buku register.'
                            : 'Arsip akan ditandai sebagai READY dan register peminjaman akan ditutup.'}
                    </span>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition ${
                            isBorrow ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        Ya, {isBorrow ? 'Pinjam' : 'Kembalikan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
