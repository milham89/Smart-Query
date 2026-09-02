const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Usage: node excel-to-json.js <file.xlsx>'); process.exit(1); }

// Fast sheet read without formulas/styles
const wb = XLSX.readFile(file, { cellFormula: false, cellHTML: false, cellText: false });
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

// Scan top 6 rows to find all header labels across rows (handling merged header rows)
const colMap = {};
for (let r = 0; r < Math.min(6, raw.length); r++) {
    const row = raw[r] || [];
    row.forEach((col, idx) => {
        if (!col) return;
        const text = String(col).trim().toLowerCase()
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ');
        if (text) {
            colMap[text] = idx;
            // Also store combined multi-row label if present
            if (colMap[`row${r}_${text}`] === undefined) {
                colMap[`row${r}_${text}`] = idx;
            }
        }
    });
}

// Find column index helper with priority
function findCol(keywords, defaultIdx) {
    for (const k of keywords) {
        const lower = k.toLowerCase();
        for (const [colName, idx] of Object.entries(colMap)) {
            if (colName === lower) return idx;
        }
    }
    for (const k of keywords) {
        const lower = k.toLowerCase();
        for (const [colName, idx] of Object.entries(colMap)) {
            if (colName.includes(lower)) return idx;
        }
    }
    return defaultIdx;
}

const idxKodePelaksana = findCol(['kode pelaksana', 'kode_pelaksana', 'no pelaksana', 'kode berkas'], 1);
const idxNoBoks = findCol(['no. boks', 'no boks', 'nomor boks', 'no_boks', 'boks'], 24);

// Scan for columns by keywords or specific header titles
const idxDivisi = findCol(['divisi', 'kantor pusat / cabang', 'kantor pusat', 'nama divisi'], 4);
const idxGrup = findCol(['unit kerja', 'grup', 'sub divisi', 'nama grup', 'nama unit kerja'], 5);

const idxUraian = findCol(['uraian identitas', 'uraian informasi berkas', 'uraian informasi', 'uraian 1', 'uraian'], 16);
const idxUraian2 = findCol(['uraian 2', 'uraian2', 'keterangan'], 17);
const idxTglAwal = findCol(['kurun waktu awal', 'tahun awal', 'tgl awal', 'awal'], 14);
const idxTglAkhir = findCol(['kurun waktu akhir', 'tahun akhir', 'tgl akhir', 'akhir'], 19);

// Lokasi Update (e.g. BZ1C.01.001A.01.001) vs Lokasi Lama / Gedung
let idxLokasiUpdate = findCol(['lokasi update', 'update lokasi', 'lokasi baru', 'lokasi simpan update', 'lokasi simpan baru'], -1);
let idxLokasiSimpan = findCol(['lokasi simpan', 'lokasi lama', 'lokasi awal'], 27);
let idxRuang = findCol(['ruang simpan', 'ruang', 'nama lokasi', 'gedung'], 26);
let idxStatus = findCol(['status peminjaman', 'status pinjam', 'status arsip', 'status'], -1);
let idxPeminjam = findCol(['nama peminjam', 'peminjam', 'dipinjam oleh'], -1);

// Find first row containing actual data (kode pelaksana pattern)
let dataStartRow = 0;
for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (row && row[idxKodePelaksana]) {
        const cell = String(row[idxKodePelaksana]).trim();
        // Skip header words
        if (!cell.toLowerCase().includes('kode') && !cell.toLowerCase().includes('pelaksana') && !cell.toLowerCase().includes('no')) {
            dataStartRow = i;
            break;
        }
    }
}

const dataRows = raw.slice(dataStartRow).filter(function(r) { 
    return r && r[idxKodePelaksana] && String(r[idxKodePelaksana]).trim() !== ''; 
});

function parseDate(v) {
    if (!v) return null;
    var s = String(v).trim();
    if (s.length === 8 && /^\d{8}$/.test(s)) {
        return s.substring(0, 4) + '-' + s.substring(4, 6) + '-' + s.substring(6, 8);
    }
    if (/^\d{4}$/.test(s)) return s;
    const match = s.match(/\b(19\d\d|20\d\d)\b/);
    if (match) return match[1];
    return null;
}

function parseLokasi(lok) {
    if (!lok) return { ruang: '-', rak: '-' };
    var parts = String(lok).split('.');
    return {
        ruang: parts.length >= 3 ? parts[2] : '-',
        rak: parts.length >= 5 ? parts[3] + '.' + parts[4] : (parts.length >= 4 ? parts[3] : '-')
    };
}

// Regex for dot-separated rack location code e.g. BZ1C.01.001A.01.001 or PS03.01.RO002W.01.001
const LOKASI_CODE_REGEX = /^[A-Z0-9]+(\.[A-Z0-9]+)+$/i;

var records = dataRows.map(function(r) {
    var rawLokasiUpdate = idxLokasiUpdate !== -1 ? r[idxLokasiUpdate] : null;
    
    // If not found by column name, inspect cells in row for a location pattern like BZ1C...
    if (!rawLokasiUpdate) {
        for (let colIdx = 20; colIdx < r.length; colIdx++) {
            const val = String(r[colIdx] || '').trim();
            if (LOKASI_CODE_REGEX.test(val) && val.toUpperCase().startsWith('BZ')) {
                rawLokasiUpdate = val;
                break;
            }
        }
    }
    if (!rawLokasiUpdate) {
        for (let colIdx = r.length - 1; colIdx >= 20; colIdx--) {
            const val = String(r[colIdx] || '').trim();
            if (LOKASI_CODE_REGEX.test(val)) {
                rawLokasiUpdate = val;
                break;
            }
        }
    }

    var lokasiUpdateStr = String(rawLokasiUpdate || r[idxLokasiSimpan] || '').trim();
    var lok = parseLokasi(lokasiUpdateStr);
    var tglAwal = parseDate(r[idxTglAwal]);
    var tglAkhir = parseDate(r[idxTglAkhir]);

    // Status parsing: Default must be READY unless explicitly DIPINJAM
    var statusVal = idxStatus !== -1 ? r[idxStatus] : null;
    var peminjamVal = idxPeminjam !== -1 ? r[idxPeminjam] : null;
    var statusStr = String(statusVal || '').trim().toUpperCase();

    var finalStatus = 'READY';
    var peminjamTerakhir = null;

    if (statusStr === 'DIPINJAM' || statusStr === 'PINJAM' || statusStr === 'KELUAR') {
        finalStatus = 'DIPINJAM';
        peminjamTerakhir = peminjamVal ? String(peminjamVal).trim() : null;
    } else if (peminjamVal && String(peminjamVal).trim() !== '' && String(peminjamVal).trim() !== '-') {
        // If there's an explicit borrower name
        finalStatus = 'DIPINJAM';
        peminjamTerakhir = String(peminjamVal).trim();
    } else {
        finalStatus = 'READY';
        peminjamTerakhir = null;
    }

    // Ambil Divisi dan Unit Kerja / Grup
    var divisiStr = '';
    var grupStr = '';

    // Cari di seluruh baris kolom 0 - 12 untuk teks spesifik DIVISI dan GRUP
    for (let col = 0; col <= Math.min(12, r.length - 1); col++) {
        const val = String(r[col] || '').trim();
        if (!val || /^\d+$/.test(val)) continue;

        const valUpper = val.toUpperCase();

        // Cari Divisi (misal: "DIVISI UMUM", "DIVISI HC", dll.)
        if (!divisiStr && valUpper.startsWith('DIVISI')) {
            divisiStr = val;
        } else if (!divisiStr && (valUpper.includes('DIVISI') || valUpper.includes('CABANG') || valUpper.includes('PUSAT'))) {
            // Hindari tulisan generic "KANTOR PUSAT" jika ada nama divisi sebenarnya
            if (valUpper !== 'KANTOR PUSAT' && valUpper !== 'KANTOR CABANG') {
                divisiStr = val;
            }
        }

        // Cari Grup / Unit Kerja (misal: "Grup Manajemen Vendor & HPS", "Grup Pengadaan Gedung dan Properti")
        if (!grupStr && (valUpper.startsWith('GRUP') || valUpper.startsWith('GROUP') || valUpper.startsWith('BAGIAN') || valUpper.startsWith('SEKSI') || valUpper.startsWith('UNIT') || valUpper.includes('PENGADAAN') || valUpper.includes('MANAJEMEN'))) {
            grupStr = val;
        }
    }

    // Fallback jika belum ketemu
    if (!divisiStr && idxDivisi !== -1) {
        const val = String(r[idxDivisi] || '').trim();
        if (val && !/^\d+$/.test(val)) divisiStr = val;
    }
    if (!grupStr && idxGrup !== -1) {
        const val = String(r[idxGrup] || '').trim();
        if (val && !/^\d+$/.test(val)) grupStr = val;
    }

    // Jika divisi masih berupa label umum 'KANTOR PUSAT', cari kolom yang mengandung kata 'DIVISI'
    if (divisiStr.toUpperCase() === 'KANTOR PUSAT' || divisiStr.toUpperCase() === 'KANTOR CABANG' || !divisiStr) {
        for (let col = 0; col <= Math.min(15, r.length - 1); col++) {
            const val = String(r[col] || '').trim();
            if (val.toUpperCase().startsWith('DIVISI')) {
                divisiStr = val;
                break;
            }
        }
    }

    var finalUnitKerja = '';
    if (divisiStr && grupStr && divisiStr !== grupStr) {
        finalUnitKerja = divisiStr + ' - ' + grupStr;
    } else {
        finalUnitKerja = grupStr || divisiStr || '-';
    }

    return {
        kode_pelaksana: String(r[idxKodePelaksana] || '').trim(),
        no_boks: String(r[idxNoBoks] || '').trim(),
        unit_kerja: finalUnitKerja,
        uraian_identitas: String(r[idxUraian] || '').trim(),
        uraian2: idxUraian2 !== -1 ? String(r[idxUraian2] || '').trim() : '',
        kurun_waktu_awal: tglAwal ? parseInt(tglAwal.substring(0, 4)) : 0,
        kurun_waktu_akhir: tglAkhir ? parseInt(tglAkhir.substring(0, 4)) : 0,
        lokasi_simpan: lokasiUpdateStr,
        ruang_simpan: String(r[idxRuang] || '').trim(),
        rak: lok.rak,
        status: finalStatus,
        peminjam_terakhir: peminjamTerakhir,
        tgl_pinjam_terakhir: finalStatus === 'DIPINJAM' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
    };
});

var outPath = process.argv[3] || path.join(__dirname, '..', 'database', 'import-data.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
console.log('Exported ' + records.length + ' records to ' + outPath);
