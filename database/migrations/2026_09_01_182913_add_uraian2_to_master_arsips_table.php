<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUraian2ToMasterArsipsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('master_arsips', function (Blueprint $table) {
            $table->text('uraian2')->nullable()->after('uraian_identitas');
        });
    }

    public function down()
    {
        Schema::table('master_arsips', function (Blueprint $table) {
            $table->dropColumn('uraian2');
        });
    }
}
