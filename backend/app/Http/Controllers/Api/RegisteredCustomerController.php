<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisteredCustomerFilterRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\Registration;
use App\Services\ReceiptMatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Admin-only Registered Customer records (replaces /validation).
 * Routes are wrapped in auth:sanctum + can:manage-registrations.
 */
class RegisteredCustomerController extends Controller
{
    private const EXPORT_COLUMNS = [
        'ID', 'Registered At', 'Full Name', 'Email', 'Contact Number', 'Complete Address',
        'Participating Unit', 'Participating Branch', 'Purchase Date', 'Reference Number', 'Ticket Number',
        'Status', 'Validated At',
    ];

    public function index(RegisteredCustomerFilterRequest $request): AnonymousResourceCollection
    {
        $paginator = Registration::query()
            ->with('branch:id,name')
            ->filter($request->filters())
            ->latest()
            ->orderByDesc('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return RegistrationResource::collection($paginator);
    }

    /**
     * CSV export of every row matching the same filters as the table
     * (all pages, not only the visible one).
     */
    public function export(RegisteredCustomerFilterRequest $request): StreamedResponse
    {
        $query = Registration::query()
            ->with('branch:id,name')
            ->filter($request->filters())
            ->latest()
            ->orderByDesc('id');

        $filename = 'whitehaus-registered-customers-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel keeps "ñ" intact.
            fputcsv($out, self::EXPORT_COLUMNS);

            foreach ($query->lazy(500) as $r) {
                fputcsv($out, array_map(fn ($v) => self::safeCell($v), [
                    $r->id,
                    $r->created_at?->format('Y-m-d H:i'),
                    $r->full_name,
                    $r->email,
                    $r->contact_number,
                    $r->address,
                    $r->unit,
                    $r->branch?->name,
                    $r->purchase_date?->toDateString(),
                    $r->reference_number,
                    $r->ticket_code,
                    $r->validated_at ? 'Validated' : 'Unvalidated',
                    $r->validated_at?->format('Y-m-d H:i'),
                ]));
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function proof(Registration $registration): StreamedResponse
    {
        Gate::authorize('manage-registrations');

        abort_unless($registration->proof_path && Storage::disk('local')->exists($registration->proof_path), 404);

        return Storage::disk('local')->response($registration->proof_path);
    }

    public function updateValidation(Request $request, Registration $registration, ReceiptMatcher $matcher): JsonResponse
    {
        Gate::authorize('manage-registrations');

        $validated = $request->validate(['validated' => ['required', 'boolean']])['validated'];

        abort_if(
            ! $validated && $registration->winnings()->exists(),
            422,
            'This registration has already won a draw and cannot be un-validated.'
        );

        $registration->forceFill([
            'validated_at' => $validated ? now() : null,
            'validated_by' => $validated ? $request->user()->id : null,
            'validation_method' => $validated ? 'manual' : null,
        ])->save();

        if (! $validated) {
            $matcher->release($registration);
        }

        return response()->json(['data' => new RegistrationResource($registration->load('branch:id,name'))]);
    }

    /** Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell). */
    private static function safeCell(mixed $value): string
    {
        $value = (string) $value;

        return preg_match('/^[=+\-@\t\r]/', $value) ? "'".$value : $value;
    }
}
