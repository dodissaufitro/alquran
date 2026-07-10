<?php

use Illuminate\Support\Facades\Route;

// Langsung arahkan ke halaman login CMS
Route::get('/', function () {
    $cmsUrl = app()->isLocal() ? 'http://localhost:5173/admin.html' : '/admin.html';
    return redirect()->away($cmsUrl);
});

Route::get('/admin', function () {
    $cmsUrl = app()->isLocal() ? 'http://localhost:5173/admin.html' : '/admin.html';
    return redirect()->away($cmsUrl);
});

Route::get('/cms', function () {
    $cmsUrl = app()->isLocal() ? 'http://localhost:5173/admin.html' : '/admin.html';
    return redirect()->away($cmsUrl);
});

Route::get('/login', function () {
    $cmsUrl = app()->isLocal() ? 'http://localhost:5173/admin.html' : '/admin.html';
    return redirect()->away($cmsUrl);
});

Route::get('/uploads/{path}', function ($path) {
    $candidates = [
        base_path('public/uploads/' . $path),
        dirname(base_path()) . '/uploads/' . $path,
        dirname(base_path()) . '/public/uploads/' . $path,
        dirname(base_path()) . '/dist/uploads/' . $path,
    ];
    foreach ($candidates as $file) {
        if (is_file($file)) {
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            $types = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
            ];
            return response()->file($file, [
                'Content-Type' => $types[$ext] ?? 'application/octet-stream',
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }
    }
    abort(404);
})->where('path', '.*');

