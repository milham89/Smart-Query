<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRegisterPeminjamenTable extends Migration
{
    public function up()
    {
        Schema::create('register_peminjamen', function (Blueprint $table) {
            $table->id();
            $table->string('no_register')->unique()->index();
            $table->date('tanggal_request');
            $table->string('nama_pemohon');
            $table->string('kode_pelaksana');
            $table->text('identitas_arsip');
            $table->string('lokasi_simpan');
            $table->date('tgl_pengembalian')->nullable();
            $table->timestamps();

            $table->foreign('kode_pelaksana')
                ->references('kode_pelaksana')
                ->on('master_arsips')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('register_peminjamen');
    }
}
