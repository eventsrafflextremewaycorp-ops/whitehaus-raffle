<?php

namespace App\Services;

use App\Models\Registration;
use App\Models\User;
use App\Models\Winner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * The raffle draw (port of draw/draw.php, draw/save_winner.php).
 *
 * Same rules as before: draw numbers count down from MAX_DRAW; 4..MAX = "Consolation Prize (n-3)",
 * 3..1 = "Major Prize (n)"; when nothing is left the draw is finished.
 *
 * What changed: the winner is picked HERE with random_int() (the browser used Math.random() and then
 * POSTed the result to an unauthenticated endpoint), picking and saving happen in one transaction,
 * and only validated registrations are in the pool.
 */
class DrawService
{
    public static function maxDraw(): int
    {
        return max(1, (int) config('promo.draw.max_draw', 23));
    }

    public static function majorDraws(): int
    {
        return max(0, (int) config('promo.draw.major_draws', 3));
    }

    public static function category(int $draw): string
    {
        $major = self::majorDraws();

        if ($draw >= 1 && $draw <= $major) {
            return "Major Prize ($draw)";
        }

        if ($draw > $major && $draw <= self::maxDraw()) {
            return 'Consolation Prize ('.($draw - $major).')';
        }

        return 'WhiteHaus Raffle Draw';
    }

    /** The draw number that is up next, or null once every draw has been made. */
    public function nextDraw(): ?int
    {
        $last = Winner::query()->min('draw_number');
        $next = $last === null ? self::maxDraw() : (int) $last - 1;

        return $next >= 1 ? $next : null;
    }

    /** Entries eligible for the draw: validated registrations that hold a ticket. */
    public function pool(bool $includeWinners = false): Builder
    {
        return Registration::query()
            ->whereNotNull('validated_at')
            ->whereNotNull('ticket_code')
            ->when(! $includeWinners, fn (Builder $q) => $q->whereDoesntHave('winnings'));
    }

    /** @return array<string, mixed> */
    public function state(bool $includeWinners = false): array
    {
        $next = $this->nextDraw();

        return [
            'max_draw' => self::maxDraw(),
            'next_draw' => $next,
            'category' => $next === null ? null : self::category($next),
            'finished' => $next === null,
            'drawn' => Winner::count(),
            'eligible' => $this->pool($includeWinners)->count(),
            'published' => Winner::whereNotNull('announced_at')->exists(),
        ];
    }

    public function spin(User $by, bool $includeWinners = false): Winner
    {
        try {
            return DB::transaction(function () use ($by, $includeWinners) {
                // Serialise concurrent spins (e.g. two staff in different browsers).
                Winner::query()->lockForUpdate()->orderByDesc('id')->limit(1)->get();

                $draw = $this->nextDraw();

                if ($draw === null) {
                    throw new ConflictHttpException('Congratulations to all the Winners! Every draw has been made.');
                }

                $size = $this->pool($includeWinners)->count();

                if ($size === 0) {
                    throw new UnprocessableEntityHttpException('There are no eligible validated tickets to draw from.');
                }

                $registration = $this->pool($includeWinners)
                    ->orderBy('id')
                    ->offset(random_int(0, $size - 1))
                    ->limit(1)
                    ->firstOrFail();

                return Winner::create([
                    'registration_id' => $registration->id,
                    'draw_number' => $draw,
                    'drawn_by' => $by->id,
                ])->load('registration.branch:id,name');
            });
        } catch (QueryException $e) {
            // UNIQUE(draw_number): another session saved this draw first.
            throw new ConflictHttpException('This draw was just made in another session. Reload to continue.', $e);
        }
    }
}
