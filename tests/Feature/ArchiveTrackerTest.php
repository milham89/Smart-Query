<?php

namespace Tests\Feature;

use App\Models\MasterArsip;
use App\Models\RegisterPeminjaman;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArchiveTrackerTest extends TestCase
{
    use RefreshDatabase;

    private function createArsip($overrides = [])
    {
        return MasterArsip::create(array_merge([
            'kode_pelaksana'    => 'PLK-00001',
            'no_boks'           => 'BKS-0001',
            'unit_kerja'        => 'Bagian Umum',
            'uraian_identitas'  => 'Dokumen test',
            'kurun_waktu_awal'  => 2020,
            'kurun_waktu_akhir' => 2024,
            'lokasi_simpan'     => '168.05.25',
            'ruang_simpan'      => 'DPCL2',
            'rak'               => 'R16',
            'status'            => 'READY',
        ], $overrides));
    }

    public function test_can_search_archive_by_code_and_box()
    {
        $this->createArsip();

        $response = $this->postJson('/tracker/search', [
            'kode_pelaksana' => 'PLK-00001',
            'no_boks'        => 'BKS-0001',
        ]);

        $response->assertOk();
        $response->assertJsonCount(1, 'results');
    }

    public function test_cannot_borrow_already_borrowed_archive()
    {
        $this->createArsip(['status' => 'DIPINJAM', 'peminjam_terakhir' => 'John']);

        $response = $this->postJson('/tracker/borrow', [
            'kode_pelaksana' => 'PLK-00001',
            'nama_peminjam'  => 'Jane',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Berkas masih dipinjam oleh John']);
    }

    public function test_borrow_updates_master_and_creates_register_log()
    {
        $this->createArsip();

        $response = $this->postJson('/tracker/borrow', [
            'kode_pelaksana' => 'PLK-00001',
            'nama_peminjam'  => 'Jane',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('master_arsips', [
            'kode_pelaksana' => 'PLK-00001',
            'status'         => 'DIPINJAM',
            'peminjam_terakhir' => 'Jane',
        ]);
        $this->assertDatabaseCount('register_peminjamen', 1);
    }

    public function test_return_updates_master_and_closes_register_log()
    {
        $arsip = $this->createArsip([
            'status'             => 'DIPINJAM',
            'peminjam_terakhir'  => 'Jane',
            'tgl_pinjam_terakhir' => now()->toDateString(),
        ]);

        RegisterPeminjaman::create([
            'no_register'     => now()->format('Ymd') . '0001',
            'tanggal_request' => now()->toDateString(),
            'nama_pemohon'    => 'Jane',
            'kode_pelaksana'  => 'PLK-00001',
            'identitas_arsip' => 'Dokumen test',
            'lokasi_simpan'   => '168.05.25',
        ]);

        $response = $this->postJson('/tracker/return', [
            'kode_pelaksana' => 'PLK-00001',
            'nama_peminjam'  => 'Jane',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('master_arsips', [
            'kode_pelaksana' => 'PLK-00001',
            'status'         => 'READY',
        ]);
        $this->assertDatabaseHas('register_peminjamen', [
            'kode_pelaksana' => 'PLK-00001',
        ]);
        $register = RegisterPeminjaman::where('kode_pelaksana', 'PLK-00001')->first();
        $this->assertNotNull($register->tgl_pengembalian);
    }

    public function test_cannot_return_already_ready_archive()
    {
        $this->createArsip();

        $response = $this->postJson('/tracker/return', [
            'kode_pelaksana' => 'PLK-00001',
            'nama_peminjam'  => 'Jane',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Berkas sudah berada di rak.']);
    }
}
