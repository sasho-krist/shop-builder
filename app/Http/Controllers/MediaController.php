<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Store an uploaded image and return its public URL. Used by section
     * image fields in the page editor.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = Tenant::currentOrFail();

        $request->validate(['file' => ['required', 'image', 'max:5120']]);

        $path = $request->file('file')->store("tenants/{$tenant->id}/media", 'public');

        abort_unless(is_string($path), 422, 'Could not store the file.');

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }
}
