<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterArsip extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_pelaksana',
        'no_boks',
        'unit_kerja',
        'uraian_identitas',
        'uraian2',
        'kurun_waktu_awal',
        'kurun_waktu_akhir',
        'lokasi_simpan',
        'ruang_simpan',
        'rak',
        'status',
        'peminjam_terakhir',
        'tgl_pinjam_terakhir',
    ];

    protected $casts = [
        'tgl_pinjam_terakhir' => 'datetime',
    ];

    public function registerPeminjaman()
    {
        return $this->hasMany(RegisterPeminjaman::class, 'kode_pelaksana', 'kode_pelaksana');
    }
}
