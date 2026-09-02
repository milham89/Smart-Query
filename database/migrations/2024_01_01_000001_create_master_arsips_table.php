<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMasterArsipsTable extends Migration
{
    public function up()
    {
        Schema::create('master_arsips', function (Blueprint $table) {
            $table->id();
            $table->string('kode_pelaksana')->unique()->index();
            $table->string('no_boks')->index();
            $table->text('unit_kerja')->nullable();
            $table->text('uraian_identitas');
            $table->integer('kurun_waktu_awal');
            $table->integer('kurun_waktu_akhir');
            $table->string('lokasi_simpan');
            $table->string('ruang_simpan');
            $table->string('rak');
            $table->enum('status', ['READY', 'DIPINJAM'])->default('READY');
            $table->string('peminjam_terakhir')->nullable();
            $table->date('tgl_pinjam_terakhir')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('master_arsips');
    }
}
