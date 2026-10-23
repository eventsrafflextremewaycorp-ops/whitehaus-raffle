<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prize;
use App\Models\Registration;
use App\Models\Winner;
use App\Services\DrawService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Staff-only raffle draw (replaces draw/index.php, tickets.php, winners.php, save_winner.php).
 * Every route sits behind auth:sanctum + can:manage-registrations.
 */
class DrawController extends Controller
{
    public function __construct(private readonly DrawService $draw) {}

    public function state(Request $request): JsonResponse
    {
        Gate::authorize('manage-registrations');

        return response()->json(['data' => $this->draw->state($request->boolean('include_winners'))]);
    }

    public function spin(Request $request): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $include = $request->validate(['include_winners' => ['sometimes', 'boolean']])['include_winners'] ?? false;

        $winner = $this->draw->spin($request->user(), (bool) $include);

        return response()->json([
            'data' => ['winner' => $this->presentWinner($winner)],
            'state' => $this->draw->state((bool) $include),
        ], 201);
    }

    /** Every ticket (registration) with its entry status; search by ticket, name or reference. */
    public function tickets(Request $request): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'entry' => ['nullable', Rule::in(['all', 'eligible', 'won', 'pending'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Registration::query()->with(['branch:id,name', 'winnings:id,registration_id,draw_number']);

        if (! empty($data['search'])) {
            $like = '%'.trim($data['search']).'%';
            $query->where(fn ($q) => $q->where('ticket_code', 'like', $like)
                ->orWhere('full_name', 'like', $like)
                ->orWhere('reference_number', 'like', $like));
        }

        match ($data['entry'] ?? 'all') {
            'eligible' => $query->whereNotNull('validated_at')->whereDoesntHave('winnings'),
            'won' => $query->whereHas('winnings'),
            'pending' => $query->whereNull('validated_at'),
            default => null,
        };

        $paginator = $query->orderByDesc('id')->paginate((int) ($data['per_page'] ?? 25))->withQueryString();

        return response()->json([
            'data' => $paginator->getCollection()->map(fn (Registration $r) => [
                'id' => $r->id,
                'ticket_code' => $r->ticket_code,
                'full_name' => $r->full_name,
                'branch' => $r->branch?->name,
                'reference_number' => $r->reference_number,
                'registered_at' => $r->created_at?->toIso8601String(),
                'entry' => $r->winnings->isNotEmpty() ? 'won' : ($r->validated_at ? 'eligible' : 'pending'),
                'draw_number' => $r->winnings->min('draw_number'),
            ])->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function winners(): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $winners = Winner::query()
            ->with(['registration.branch:id,name', 'prize:id,name'])
            ->orderBy('draw_number')
            ->get();

        return response()->json([
            'data' => $winners->map(fn (Winner $w) => $this->presentWinner($w))->values(),
            'state' => $this->draw->state(),
            'prizes' => Prize::where('is_active', true)->orderBy('sort_order')->get(['id', 'name'])->values(),
        ]);
    }

    /** Undo the most recent draw (the lowest draw number) - only while winners are unpublished. */
    public function undoLast(): JsonResponse
    {
        Gate::authorize('manage-registrations');

        DB::transaction(function () {
            $last = Winner::query()->lockForUpdate()->orderBy('draw_number')->first();

            abort_if($last === null, 404, 'There is no draw to undo.');
            abort_if($last->announced_at !== null, 422, 'Winners are already published. Unpublish them first.');

            $last->delete();
        });

        return response()->json(['state' => $this->draw->state()]);
    }

    public function publish(Request $request): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $published = $request->validate(['published' => ['required', 'boolean']])['published'];

        Winner::query()->update(['announced_at' => $published ? now() : null]);

        return response()->json(['state' => $this->draw->state()]);
    }

    public function assignPrize(Request $request, Winner $winner): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $data = $request->validate(['prize_id' => ['nullable', 'integer', Rule::exists('prizes', 'id')->where('is_active', true)]]);
        $winner->update(['prize_id' => $data['prize_id']]);

        return response()->json(['data' => $this->presentWinner($winner->load('registration.branch:id,name', 'prize:id,name'))]);
    }

    private function presentWinner(Winner $w): array
    {
        return [
            'id' => $w->id,
            'draw_number' => $w->draw_number,
            'category' => $w->category(),
            'ticket_code' => $w->registration->ticket_code,
            'full_name' => $w->registration->full_name,
            'email' => $w->registration->email,
            'contact_number' => $w->registration->contact_number,
            'branch' => $w->registration->branch?->name,
            'prize' => $w->prize?->name,
            'prize_id' => $w->prize_id,
            'announced_at' => $w->announced_at?->toIso8601String(),
        ];
    }
}
