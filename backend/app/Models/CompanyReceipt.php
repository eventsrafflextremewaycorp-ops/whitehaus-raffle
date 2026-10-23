<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyReceipt extends Model
{
    public const ACTIVE = 'active';

    public const TAKEN = 'taken';

    protected $fillable = ['receipt_number', 'status', 'date_bought', 'registration_id', 'taken_at'];

    protected function casts(): array
    {
        return ['date_bought' => 'date', 'taken_at' => 'datetime'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /** Receipt numbers are compared case-insensitively and without surrounding spaces. */
    public static function normalize(string $number): string
    {
        return strtoupper(trim(preg_replace('/\s+/', ' ', $number)));
    }
}
