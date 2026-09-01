import React from 'react';
import { MapPin, Box, Layers, FileText, User, Calendar } from 'lucide-react';

export default function SearchResultCard({ arsip }) {
    const isReady = arsip.status === 'READY';

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 ${isReady ? 'border-emerald-500' : 'border-red-500'} border border-slate-200 p-4`}>
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">{arsip.kode_pelaksana}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs text-slate-500">{arsip.unit_kerja}</span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                    isReady
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {isReady ? '✓ READY' : (
                        <>
                            DIPINJAM — {arsip.peminjam_terakhir}
                            {arsip.tgl_pinjam_terakhir && (
                                <span className="ml-1 font-normal">({new Date(arsip.tgl_pinjam_terakhir).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })})</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="flex items-start gap-1.5">
                    <Box size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block">No. Boks</span>
                        <span className="text-slate-700 font-medium">{arsip.no_boks}</span>
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block">Nama Lokasi</span>
                        <span className="text-slate-700 font-medium">{arsip.ruang_simpan}</span>
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <Layers size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block">Lokasi Simpan</span>
                        <span className="text-slate-700 font-medium">{arsip.lokasi_simpan}</span>
                    </div>
                </div>
                <div className="flex items-start gap-1.5">
                    <Calendar size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <span className="text-slate-400 block">Kurun Waktu</span>
                        <span className="text-slate-700 font-medium">{arsip.kurun_waktu_awal} — {arsip.kurun_waktu_akhir}</span>
                    </div>
                </div>
            </div>

            {/* Uraian */}
            <div className="mt-3 flex items-start gap-1.5 text-xs">
                <FileText size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                    <span className="text-slate-400">Uraian: </span>
                    <span className="text-slate-600">{arsip.uraian_identitas}</span>
                    {arsip.uraian2 && (
                        <>
                            <span className="text-slate-300 mx-1">|</span>
                            <span className="text-slate-500">{arsip.uraian2}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
