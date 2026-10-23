<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Winner extends Model
{
    protected $fillable = ['registration_id', 'prize_id', 'draw_number', 'drawn_by', 'announced_at'];

    protected function casts(): array
    {
        return ['announced_at' => 'datetime', 'draw_number' => 'integer'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function prize(): BelongsTo
    {
        return $this->belongsTo(Prize::class);
    }

    public function scopeAnnounced(Builder $query): Builder
    {
        return $query->whereNotNull('announced_at')->where('announced_at', '<=', now());
    }

    /** "Major Prize (2)" / "Consolation Prize (17)" */
    public function category(): string
    {
        return \App\Services\DrawService::category((int) $this->draw_number);
    }
}
