<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyReceipt;
use App\Services\ReceiptMatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Company receipts (was "Company Serials": list, Add Serial, Import, Active/Taken filter).
 */
class CompanyReceiptController extends Controller
{
    private const MAX_ROWS = 50000;

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['all', 'active', 'taken'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = CompanyReceipt::query()
            ->with('registration:id,full_name,ticket_code')
            ->when(! empty($data['search']), fn ($q) => $q->where('receipt_number', 'like', '%'.trim($data['search']).'%'))
            ->when(in_array($data['status'] ?? 'all', ['active', 'taken'], true), fn ($q) => $q->where('status', $data['status']))
            ->orderByDesc('id')
            ->paginate((int) ($data['per_page'] ?? 25))
            ->withQueryString();

        $counts = CompanyReceipt::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'data' => $paginator->getCollection()->map(fn (CompanyReceipt $r) => $this->present($r))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'counts' => ['active' => (int) ($counts['active'] ?? 0), 'taken' => (int) ($counts['taken'] ?? 0)],
        ]);
    }

    public function store(Request $request, ReceiptMatcher $matcher): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $request->merge(['receipt_number' => CompanyReceipt::normalize((string) $request->input('receipt_number'))]);

        $data = $request->validate([
            'receipt_number' => ['required', 'string', 'max:100', Rule::unique('company_receipts', 'receipt_number')],
            'date_bought' => ['nullable', 'date_format:Y-m-d'],
        ], ['receipt_number.unique' => 'This receipt number is already on the list.']);

        $receipt = CompanyReceipt::create($data + ['status' => CompanyReceipt::ACTIVE]);
        $matched = $matcher->matchReceipt($receipt);

        return response()->json(['data' => $this->present($receipt->fresh('registration')), 'matched' => $matched], 201);
    }

    /** CSV: first column = receipt number, optional second column = date bought (YYYY-MM-DD or similar). */
    public function import(Request $request, ReceiptMatcher $matcher): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:5120']]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        abort_if($handle === false, 422, 'The file could not be read.');

        $added = $duplicates = $invalid = $matched = $rows = 0;
        $seen = [];

        while (($cols = fgetcsv($handle)) !== false) {
            if ($cols === [null] || $cols === []) {
                continue;
            }

            if (++$rows > self::MAX_ROWS) {
                fclose($handle);
                abort(422, 'Too many rows. Import at most '.self::MAX_ROWS.' receipts at a time.');
            }

            $number = CompanyReceipt::normalize(ltrim((string) $cols[0], "\xEF\xBB\xBF"));

            // Skip a header row.
            if ($rows === 1 && preg_match('/^(receipt|serial|reference|official)/i', $number)) {
                continue;
            }

            if ($number === '' || strlen($number) > 100) {
                $invalid++;

                continue;
            }

            if (isset($seen[$number]) || CompanyReceipt::where('receipt_number', $number)->exists()) {
                $duplicates++;

                continue;
            }
            $seen[$number] = true;

            $date = null;
            if (! empty($cols[1])) {
                try {
                    $date = Carbon::parse($cols[1])->toDateString();
                } catch (\Throwable) {
                    $date = null;
                }
            }

            $receipt = CompanyReceipt::create([
                'receipt_number' => $number,
                'status' => CompanyReceipt::ACTIVE,
                'date_bought' => $date,
            ]);
            $added++;

            if ($matcher->matchReceipt($receipt)) {
                $matched++;
            }
        }

        fclose($handle);

        return response()->json([
            'message' => "Imported {$added} receipt(s); {$matched} registration(s) validated automatically.",
            'data' => compact('added', 'duplicates', 'invalid', 'matched'),
        ]);
    }

    public function destroy(CompanyReceipt $receipt): JsonResponse
    {
        Gate::authorize('manage-registrations');

        abort_if($receipt->status === CompanyReceipt::TAKEN, 422, 'A receipt that already validated a registration cannot be deleted.');

        $receipt->delete();

        return response()->json(['message' => 'Receipt removed.']);
    }

    private function present(CompanyReceipt $r): array
    {
        return [
            'id' => $r->id,
            'receipt_number' => $r->receipt_number,
            'status' => $r->status,
            'date_bought' => $r->date_bought?->toDateString(),
            'taken_at' => $r->taken_at?->toIso8601String(),
            'registration' => $r->registration ? [
                'id' => $r->registration->id,
                'full_name' => $r->registration->full_name,
                'ticket_code' => $r->registration->ticket_code,
            ] : null,
        ];
    }
}
