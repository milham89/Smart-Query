const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Usage: node excel-to-json.js <file.xlsx>'); process.exit(1); }

const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Skip 3 header rows (row 0=merged header, row 1=column names, row 2=column numbers)
const dataRows = raw.slice(3).filter(function(r) { return r[1]; }); // must have kode_pelaksana

function parseDate(v) {
    if (!v) return null;
    var s = String(v);
    if (s.length === 8 && /^\d{8}$/.test(s)) {
        return s.substring(0, 4) + '-' + s.substring(4, 6) + '-' + s.substring(6, 8);
    }
    return null;
}

function parseLokasi(lok) {
    // lokasi format: PS03.01.RO002W.01.001
    // extract ruang and rak from parts
    if (!lok) return { ruang: '-', rak: '-' };
    var parts = String(lok).split('.');
    return {
        ruang: parts.length >= 3 ? parts[2] : '-',
        rak: parts.length >= 5 ? parts[3] + '.' + parts[4] : (parts.length >= 4 ? parts[3] : '-')
    };
}

var records = dataRows.map(function(r) {
    var lok = parseLokasi(r[27]);
    var tglAwal = parseDate(r[14]);
    var tglAkhir = parseDate(r[19]);
    return {
        kode_pelaksana: String(r[1] || '').trim(),
        no_boks: String(r[24] || '').trim(),
        unit_kerja: String(r[5] || '').trim(),
        uraian_identitas: String(r[16] || '').trim(),
        uraian2: String(r[17] || '').trim(),
        kurun_waktu_awal: tglAwal ? parseInt(tglAwal.substring(0, 4)) : 0,
        kurun_waktu_akhir: tglAkhir ? parseInt(tglAkhir.substring(0, 4)) : 0,
        lokasi_simpan: String(r[27] || '').trim(),
        ruang_simpan: String(r[26] || r[25] || '').trim(),
        rak: lok.rak,
        status: r[37] ? 'DIPINJAM' : 'READY'
    };
});

var outPath = process.argv[3] || path.join(__dirname, '..', 'database', 'import-data.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
console.log('Exported ' + records.length + ' records to ' + outPath);
