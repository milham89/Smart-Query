<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegisterPeminjaman extends Model
{
    use HasFactory;

    protected $table = 'register_peminjamen';

    protected $fillable = [
        'no_register',
        'tanggal_request',
        'nama_pemohon',
        'kode_pelaksana',
        'identitas_arsip',
        'lokasi_simpan',
        'tgl_pengembalian',
    ];

    protected $casts = [
        'tanggal_request' => 'datetime',
        'tgl_pengembalian' => 'datetime',
    ];

    protected function serializeDate(\DateTimeInterface $date)
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function masterArsip()
    {
        return $this->belongsTo(MasterArsip::class, 'kode_pelaksana', 'kode_pelaksana');
    }
}
