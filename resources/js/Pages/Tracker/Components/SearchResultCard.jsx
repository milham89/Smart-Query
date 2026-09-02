import React from 'react';
import { MapPin, Box, Layers, FileText, User, Calendar, Building, Copy } from 'lucide-react';

function formatDateTime(d) {
    if (!d) return '';
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

export default function SearchResultCard({ arsip, isDuplicate = false }) {
    const isReady = arsip.status === 'READY';

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 ${isReady ? 'border-emerald-500' : 'border-red-500'} border border-slate-200 p-4 relative`}>
            {/* Status & Duplicate Badge */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Unit Kerja */}
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-md">
                        <Building size={12} className="text-slate-500" />
                        {arsip.unit_kerja || '-'}
                    </span>
                    {/* 2. Kode Pelaksana */}
                    <span className="font-mono font-bold text-blue-700 text-sm bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                        {arsip.kode_pelaksana}
                    </span>
                    {isDuplicate && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            <Copy size={11} /> DUPLICATE
                        </span>
                    )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                    isReady
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {isReady ? '✓ READY' : (
                        <>
                            DIPINJAM — {arsip.peminjam_terakhir}
                            {arsip.tgl_pinjam_terakhir && (
                                <span className="ml-1 font-normal">({formatDateTime(arsip.tgl_pinjam_terakhir)})</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Detail Fields in Required Order */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
                {/* 3. No. Boks */}
                <div className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Box size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block text-[11px]">No. Boks</span>
                        <span className="text-slate-700 font-semibold">{arsip.no_boks || '-'}</span>
                    </div>
                </div>

                {/* 5. Kurun Waktu */}
                <div className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Calendar size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block text-[11px]">Kurun Waktu</span>
                        <span className="text-slate-700 font-semibold">{arsip.kurun_waktu_awal || '-'} — {arsip.kurun_waktu_akhir || '-'}</span>
                    </div>
                </div>

                {/* 6. Lokasi Update */}
                <div className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <MapPin size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block text-[11px]">Lokasi Update</span>
                        <span className="text-slate-700 font-semibold">
                            {[arsip.ruang_simpan, arsip.lokasi_simpan, arsip.rak ? `Rak ${arsip.rak}` : null].filter(Boolean).join(' • ') || '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. Uraian */}
            <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-xs">
                <div className="flex items-start gap-1.5">
                    <FileText size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px] font-medium">Uraian</span>
                        <p className="text-slate-700 leading-relaxed">{arsip.uraian_identitas || '-'}</p>
                        {arsip.uraian2 && (
                            <p className="text-slate-500 border-t border-slate-200/60 pt-1 mt-1">{arsip.uraian2}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
