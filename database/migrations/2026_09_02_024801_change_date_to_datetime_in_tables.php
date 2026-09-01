<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ChangeDateToDatetimeInTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement('ALTER TABLE `master_arsips` MODIFY `tgl_pinjam_terakhir` DATETIME NULL');
        DB::statement('ALTER TABLE `register_peminjamen` MODIFY `tanggal_request` DATETIME NOT NULL');
        DB::statement('ALTER TABLE `register_peminjamen` MODIFY `tgl_pengembalian` DATETIME NULL');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('ALTER TABLE `master_arsips` MODIFY `tgl_pinjam_terakhir` DATE NULL');
        DB::statement('ALTER TABLE `register_peminjamen` MODIFY `tanggal_request` DATE NOT NULL');
        DB::statement('ALTER TABLE `register_peminjamen` MODIFY `tgl_pengembalian` DATE NULL');
    }
}
