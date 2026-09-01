<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MasterArsip;

class ImportArsip extends Command
{
    protected $signature = 'arsip:import {file? : Path to JSON file}';
    protected $description = 'Import arsip data from JSON (converted from Excel)';

    public function handle()
    {
        $file = $this->argument('file') ?: database_path('import-data.json');

        if (!file_exists($file)) {
            $this->error("File not found: {$file}");
            return 1;
        }

        $data = json_decode(file_get_contents($file), true);
        if (!$data) {
            $this->error('Invalid JSON');
            return 1;
        }

        $bar = $this->output->createProgressBar(count($data));
        $imported = 0;
        $skipped = 0;

        foreach ($data as $row) {
            $exists = MasterArsip::where('kode_pelaksana', $row['kode_pelaksana'])->exists();
            if ($exists) {
                $skipped++;
                $bar->advance();
                continue;
            }

            MasterArsip::create($row);
            $imported++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done! Imported: {$imported}, Skipped (duplicate): {$skipped}");
        return 0;
    }
}
