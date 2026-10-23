<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name', 'email', 'contact_number', 'address', 'unit', 'branch_id',
        'purchase_date', 'reference_number', 'proof_path', 'ticket_code',
        'privacy_consented_at', 'terms_accepted_at',
    ];

    protected $hidden = ['proof_path'];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'privacy_consented_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'validated_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Registration $registration) {
            $registration->ticket_code ??= static::newTicketCode();
        });
    }

    /** "WH-" + 20 characters from a CSPRNG (the old code used rand()). Collisions are retried. */
    public static function newTicketCode(): string
    {
        do {
            $code = 'WH-'.Str::upper(Str::random(20));
        } while (static::where('ticket_code', $code)->exists());

        return $code;
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function winnings(): HasMany
    {
        return $this->hasMany(Winner::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /**
     * Shared filter used by the table, its pagination and the CSV export so the
     * three can never disagree about which rows match.
     *
     * @param  array{search?: ?string, date_from?: ?string, date_to?: ?string, status?: ?string}  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $like = '%'.$search.'%';

            $query->where(function (Builder $q) use ($like) {
                $q->where('full_name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('contact_number', 'like', $like)
                    ->orWhere('reference_number', 'like', $like)
                    ->orWhere('ticket_code', 'like', $like)
                    ->orWhere('unit', 'like', $like)
                    ->orWhereHas('branch', fn (Builder $b) => $b->where('name', 'like', $like));
            });
        }

        // Date range applies to the registration date, in the app timezone.
        if (! empty($filters['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        match ($filters['status'] ?? 'all') {
            'validated' => $query->whereNotNull('validated_at'),
            'unvalidated' => $query->whereNull('validated_at'),
            default => null,
        };

        return $query;
    }
}
