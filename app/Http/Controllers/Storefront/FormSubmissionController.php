<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\FormSubmission;
use App\Models\Page;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class FormSubmissionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['nullable', 'string', 'max:255'],
            'form_name' => ['nullable', 'string', 'max:255'],
            'company_website' => ['nullable', 'string'],
            'fields' => ['required', 'array', 'min:1', 'max:50'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.value' => ['present'],
        ]);

        // Honeypot: bots fill hidden fields, humans never see them. Pretend it
        // worked so the bot moves on.
        if ($request->filled('company_website')) {
            return response()->json(['ok' => true]);
        }

        $pageSlug = $request->string('page')->toString();
        $page = $pageSlug === ''
            ? null
            : Page::query()->where('slug', $pageSlug)->first();

        $fields = [];

        foreach ($request->collect('fields') as $field) {
            if (! is_array($field)) {
                continue;
            }

            $fields[] = [
                'label' => $this->stringify($field['label'] ?? ''),
                'value' => $this->stringify($field['value'] ?? ''),
            ];
        }

        $submission = FormSubmission::create([
            'page_id' => $page?->id,
            'form_name' => $request->string('form_name')->toString() ?: null,
            'data' => $fields,
        ]);

        $this->notifyOwner($submission);

        return response()->json(['ok' => true]);
    }

    private function stringify(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return is_scalar($value) ? (string) $value : '';
    }

    private function notifyOwner(FormSubmission $submission): void
    {
        $email = Tenant::currentOrFail()->storeSettings()->store_email;

        if ($email === null || $email === '') {
            return;
        }

        $lines = [];

        foreach ($submission->data as $row) {
            if (! is_array($row)) {
                continue;
            }

            $lines[] = $this->stringify($row['label'] ?? '').': '.$this->stringify($row['value'] ?? '');
        }

        $body = implode("\n", $lines);
        $subject = 'New form submission: '.($submission->form_name ?? 'Contact form');

        try {
            Mail::raw($body, function ($message) use ($email, $subject): void {
                $message->to($email)->subject($subject);
            });
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
