<?php

use App\Http\Controllers\ArchiveTrackerController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ArchiveTrackerController::class, 'index'])->name('tracker.index');
Route::post('/tracker/search', [ArchiveTrackerController::class, 'search'])->name('tracker.search');
Route::post('/tracker/borrow', [ArchiveTrackerController::class, 'borrow'])->name('tracker.borrow');
Route::post('/tracker/return', [ArchiveTrackerController::class, 'return'])->name('tracker.return');
Route::get('/register', [ArchiveTrackerController::class, 'register'])->name('tracker.register');
Route::get('/upload', [ArchiveTrackerController::class, 'upload'])->name('tracker.upload');
Route::post('/upload', [ArchiveTrackerController::class, 'uploadProcess'])->name('tracker.upload.process');
