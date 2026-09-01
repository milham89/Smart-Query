<?php

namespace Database\Seeders;

use App\Models\MasterArsip;
use App\Models\RegisterPeminjaman;
use Illuminate\Database\Seeder;

class MasterArsipSeeder extends Seeder
{
    public function run()
    {
        $units = ['Bagian Umum', 'Bagian Keuangan', 'Bagian SDM', 'Bagian Hukum', 'Bagian IT'];
        $ruangs = ['DPCL1', 'DPCL2', 'DPCL3'];

        for ($i = 1; $i <= 30; $i++) {
            $kode = 'PLK-' . str_pad($i, 5, '0', STR_PAD_LEFT);
            $status = $i % 5 === 0 ? 'DIPINJAM' : 'READY';

            $arsip = MasterArsip::create([
                'kode_pelaksana'     => $kode,
                'no_boks'            => 'BKS-' . str_pad(rand(1, 200), 4, '0', STR_PAD_LEFT),
                'unit_kerja'         => $units[array_rand($units)],
                'uraian_identitas'   => "Dokumen arsip pelaksana {$kode} - Berkas administrasi tahun " . rand(2018, 2025),
                'kurun_waktu_awal'   => rand(2015, 2020),
                'kurun_waktu_akhir'  => rand(2021, 2025),
                'lokasi_simpan'      => rand(100, 200) . '.' . str_pad(rand(1, 20), 2, '0', STR_PAD_LEFT) . '.' . rand(1, 30),
                'ruang_simpan'       => $ruangs[array_rand($ruangs)],
                'rak'                => 'R' . rand(1, 20),
                'status'             => $status,
                'peminjam_terakhir'  => $status === 'DIPINJAM' ? 'User Demo ' . $i : null,
                'tgl_pinjam_terakhir' => $status === 'DIPINJAM' ? now()->subDays(rand(1, 30))->toDateString() : null,
            ]);

            if ($status === 'DIPINJAM') {
                RegisterPeminjaman::create([
                    'no_register'     => now()->format('Ymd') . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'tanggal_request' => now()->subDays(rand(1, 30))->toDateString(),
                    'nama_pemohon'    => 'User Demo ' . $i,
                    'kode_pelaksana'  => $kode,
                    'identitas_arsip' => $arsip->uraian_identitas,
                    'lokasi_simpan'   => $arsip->lokasi_simpan,
                ]);
            }
        }
    }
}
