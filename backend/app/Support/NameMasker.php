<?php

namespace App\Support;

/**
 * Public winner lists show a first name plus initials only, e.g.
 * "Juan Dela Cruz" -> "Juan D. C." — never contact details.
 */
class NameMasker
{
    public static function mask(string $fullName): string
    {
        $parts = preg_split('/\s+/u', trim($fullName), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            return '';
        }

        $first = array_shift($parts);
        $initials = array_map(fn (string $p) => mb_strtoupper(mb_substr($p, 0, 1)).'.', $parts);

        return trim($first.' '.implode(' ', $initials));
    }
}
