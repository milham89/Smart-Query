const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Usage: node excel-to-json.js <file.xlsx>'); process.exit(1); }

const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Detect header row (check row 0, 1, or 2 for column names)
let headerRowIndex = 1;
for (let i = 0; i < Math.min(5, raw.length); i++) {
    const rowStr = (raw[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('kode') || rowStr.includes('pelaksana') || rowStr.includes('uraian')) {
        headerRowIndex = i;
        break;
    }
}

const headerRow = raw[headerRowIndex] || [];
const colMap = {};
headerRow.forEach((col, idx) => {
    if (!col) return;
    const key = String(col).trim().toLowerCase()
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ');
    colMap[key] = idx;
});

// Find column index helper
function findCol(keywords, defaultIdx) {
    for (const k of keywords) {
        for (const [colName, idx] of Object.entries(colMap)) {
            if (colName.includes(k.toLowerCase())) return idx;
        }
    }
    return defaultIdx;
}

// Map column indexes by header names or fallback positions
const idxKodePelaksana = findCol(['kode pelaksana', 'kode_pelaksana', 'no pelaksana'], 1);
const idxNoBoks = findCol(['no. boks', 'no boks', 'nomor boks', 'no_boks', 'boks'], 24);
const idxUnitKerja = findCol(['unit kerja', 'divisi', 'unit_kerja'], 5);
const idxUraian = findCol(['uraian identitas', 'uraian informasi', 'uraian 1', 'uraian'], 16);
const idxUraian2 = findCol(['uraian 2', 'uraian2', 'keterangan'], 17);
const idxTglAwal = findCol(['kurun waktu awal', 'tahun awal', 'tgl awal', 'awal'], 14);
const idxTglAkhir = findCol(['kurun waktu akhir', 'tahun akhir', 'tgl akhir', 'akhir'], 19);

// Lokasi Update / Lokasi Baru vs Lokasi Lama:
// Priority: 'lokasi update', 'lokasi baru', 'lokasi simpan baru', 'lokasi simpan', or fallback column
let idxLokasiUpdate = findCol(['lokasi update', 'lokasi baru', 'update lokasi', 'lokasi simpan baru'], -1);
if (idxLokasiUpdate === -1) {
    // If not specifically named "lokasi update", check after column 27 or find last location-related col
    const locationCols = [];
    Object.entries(colMap).forEach(([name, idx]) => {
        if (name.includes('lokasi')) locationCols.push(idx);
    });
    if (locationCols.length > 1) {
        idxLokasiUpdate = Math.max(...locationCols);
    } else {
        idxLokasiUpdate = findCol(['lokasi simpan', 'lokasi'], 28);
    }
}

const idxRuang = findCol(['ruang simpan', 'ruang', 'nama lokasi'], 26);
const idxStatus = findCol(['status peminjaman', 'status pinjam', 'status', 'peminjam'], 37);

// Data rows start after header and sub-headers
const dataStartRow = headerRowIndex + (raw[headerRowIndex + 1] && raw[headerRowIndex + 1][idxKodePelaksana] && isNaN(raw[headerRowIndex + 1][idxKodePelaksana]) && /^\d+$/.test(raw[headerRowIndex + 1][0]) ? 1 : 2);
const dataRows = raw.slice(dataStartRow).filter(function(r) { return r && r[idxKodePelaksana]; });

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

function resolveStatus(statusVal) {
    if (!statusVal) return 'READY';
    const s = String(statusVal).trim().toUpperCase();
    if (s === 'DIPINJAM' || s === 'PINJAM' || s === 'BORROWED' || s === 'KELUAR') {
        return 'DIPINJAM';
    }
    if (s === 'READY' || s === 'TERSEDIA' || s === 'ADA' || s === 'TERSIMPAN') {
        return 'READY';
    }
    // If it's a person's name or note, it indicates DIPINJAM
    if (s.length > 0 && s !== '-' && s !== 'NO') {
        return 'DIPINJAM';
    }
    return 'READY';
}

var records = dataRows.map(function(r) {
    // Check if cell has location update (e.g. BZ1C.01.001A.01.001 or PS03...)
    // Prefer location update col, fallback to column 28 or 27
    var rawLokasiUpdate = r[idxLokasiUpdate] || r[28] || r[27] || '';
    var lokasiUpdateStr = String(rawLokasiUpdate).trim();

    var lok = parseLokasi(lokasiUpdateStr || r[27]);
    var tglAwal = parseDate(r[idxTglAwal]);
    var tglAkhir = parseDate(r[idxTglAkhir]);

    var statusRaw = idxStatus !== -1 ? r[idxStatus] : null;
    var resolvedStatus = resolveStatus(statusRaw);

    return {
        kode_pelaksana: String(r[idxKodePelaksana] || '').trim(),
        no_boks: String(r[idxNoBoks] || '').trim(),
        unit_kerja: String(r[idxUnitKerja] || '').trim(),
        uraian_identitas: String(r[idxUraian] || '').trim(),
        uraian2: idxUraian2 !== -1 ? String(r[idxUraian2] || '').trim() : '',
        kurun_waktu_awal: tglAwal ? parseInt(tglAwal.substring(0, 4)) : 0,
        kurun_waktu_akhir: tglAkhir ? parseInt(tglAkhir.substring(0, 4)) : 0,
        lokasi_simpan: lokasiUpdateStr || String(r[27] || '').trim(),
        ruang_simpan: String(r[idxRuang] || r[26] || r[25] || '').trim(),
        rak: lok.rak,
        status: resolvedStatus,
        peminjam_terakhir: resolvedStatus === 'DIPINJAM' && statusRaw && typeof statusRaw === 'string' && statusRaw.toUpperCase() !== 'DIPINJAM' ? statusRaw.trim() : null
    };
});

var outPath = process.argv[3] || path.join(__dirname, '..', 'database', 'import-data.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
console.log('Exported ' + records.length + ' records to ' + outPath);
