<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Prize;
use App\Models\Winner;
use App\Support\NameMasker;
use App\Support\SiteImages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Read-only campaign data for the public pages.
 */
class PublicContentController extends Controller
{
    public function promotion(): JsonResponse
    {
        return response()->json(['data' => [
            'name' => config('promo.name'),
            'period_start' => config('promo.period_start'),
            'period_end' => config('promo.period_end'),
            'draw_at' => Carbon::parse(config('promo.draw_at'))->toIso8601String(),
            'draw_venue' => config('promo.draw_venue'),
            'permit_no' => config('promo.permit_no'),
            'units' => config('promo.units'),
            'proof_max_kb' => (int) config('promo.proof_max_kb'),
            'registration_open' => (bool) config('promo.registration_open'),
            'banner_url' => SiteImages::bannerUrl(),
        ]]);
    }

    public function branches(): JsonResponse
    {
        $branches = Branch::active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'region', 'address', 'is_online']);

        return response()->json(['data' => $branches->map(fn (Branch $b) => [
            'id' => $b->id,
            'name' => $b->name,
            'region' => $b->region,
            'address' => $b->address,
            'is_online' => $b->is_online,
        ])->values()]);
    }

    public function prizes(): JsonResponse
    {
        $prizes = Prize::where('is_active', true)->orderBy('sort_order')->get();

        return response()->json(['data' => $prizes->map(fn (Prize $p) => [
            'id' => $p->id,
            'name' => $p->name,
            'value' => (float) $p->value,
            'quantity' => $p->quantity,
            'image_url' => $p->image_path ? asset($p->image_path) : null,
        ])->values()]);
    }

    public function winners(): JsonResponse
    {
        $winners = Winner::announced()
            ->with(['registration.branch:id,name', 'prize:id,name'])
            ->orderBy('draw_number')
            ->get();

        // Public payload: masked name, branch and prize only.
        return response()->json(['data' => $winners->map(fn (Winner $w) => [
            'id' => $w->id,
            'name' => NameMasker::mask($w->registration->full_name),
            'branch' => $w->registration->branch?->name,
            'prize' => $w->prize?->name ?? $w->category(),
            'draw_number' => $w->draw_number,
            'announced_at' => $w->announced_at?->toIso8601String(),
        ])->values()]);
    }
}
