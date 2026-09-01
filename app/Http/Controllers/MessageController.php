<?php

namespace App\Http\Controllers;

use App\Models\FormSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Contact-form submissions collected from the storefront.
 */
class MessageController extends Controller
{
    public function index(): Response
    {
        $messages = FormSubmission::query()
            ->with('page:id,title')
            ->latest()
            ->paginate(20)
            ->through(fn (FormSubmission $submission): array => [
                'id' => $submission->id,
                'form_name' => $submission->form_name,
                'page_title' => $submission->page?->title,
                'is_read' => $submission->is_read,
                'data' => $submission->data,
                'created_at' => $submission->created_at?->diffForHumans(),
                'created_at_full' => $submission->created_at?->toDayDateTimeString(),
            ]);

        return Inertia::render('admin/messages/index', [
            'messages' => $messages,
            'unread' => FormSubmission::query()->where('is_read', false)->count(),
        ]);
    }

    public function update(Request $request, int $message): RedirectResponse
    {
        $data = $request->validate(['is_read' => ['required', 'boolean']]);

        FormSubmission::findOrFail($message)->update($data);

        return back();
    }

    public function destroy(int $message): RedirectResponse
    {
        FormSubmission::findOrFail($message)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Message deleted.')]);

        return back();
    }
}
