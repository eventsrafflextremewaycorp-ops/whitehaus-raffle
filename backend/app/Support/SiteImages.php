<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * Images that admins upload from the site (home banner, prize photos).
 *
 * Files go to public/uploads/ so the web server serves them directly (no storage:link needed on shared
 * hosting). Names are random, the extension comes from the file's real content type (never from the
 * name the browser sent), and only JPEG, PNG and WebP are accepted: no SVG, so nothing can carry script.
 */
class SiteImages
{
    public const ALLOWED = ['jpg', 'jpeg', 'png', 'webp'];

    public static function dir(string $sub = ''): string
    {
        return rtrim(public_path('uploads'.($sub !== '' ? '/'.$sub : '')), '/');
    }

    /** Saves the file and returns its path relative to public/ (e.g. "uploads/banner-abc.jpg"). */
    public static function store(UploadedFile $file, string $sub, string $prefix): string
    {
        $ext = strtolower($file->extension());
        $ext = $ext === 'jpeg' ? 'jpg' : $ext;
        abort_unless(in_array($ext, self::ALLOWED, true), 422, 'Upload a JPG, PNG or WebP image.');

        $dir = self::dir($sub);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $name = $prefix.'-'.Str::lower(Str::random(12)).'.'.$ext;
        $file->move($dir, $name);

        return 'uploads/'.($sub !== '' ? $sub.'/' : '').$name;
    }

    /** Deletes a previously uploaded file. Only paths inside public/uploads/ are ever touched. */
    public static function forget(?string $relative): void
    {
        if (! $relative || ! str_starts_with($relative, 'uploads/') || str_contains($relative, '..')) {
            return;
        }

        $path = public_path($relative);
        $root = realpath(self::dir());
        $real = is_file($path) ? realpath($path) : false;

        if ($root && $real && str_starts_with($real, $root.DIRECTORY_SEPARATOR)) {
            @unlink($real);
        }
    }

    /** Newest uploaded banner, else a banner.jpg shipped in public/brand/, else null (the site shows a placeholder). */
    public static function bannerUrl(): ?string
    {
        $files = glob(self::dir().'/banner-*.*') ?: [];
        usort($files, fn ($a, $b) => filemtime($b) <=> filemtime($a));

        if ($files !== []) {
            return asset('uploads/'.basename($files[0]));
        }

        return is_file(public_path('brand/banner.jpg')) ? asset('brand/banner.jpg') : null;
    }

    public static function forgetBanners(): void
    {
        foreach (glob(self::dir().'/banner-*.*') ?: [] as $file) {
            self::forget('uploads/'.basename($file));
        }
    }
}
