<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class ProductImageController extends Controller
{
    public function store(Request $request, int $product): RedirectResponse
    {
        $model = Product::findOrFail($product);

        $request->validate([
            'images' => ['required', 'array', 'max:10'],
            'images.*' => ['image', 'max:5120'],
        ]);

        $maxPosition = $model->images()->max('position');
        $position = $maxPosition === null ? 0 : (int) $maxPosition + 1;

        foreach (Arr::wrap($request->file('images')) as $file) {
            $path = $file->store("tenants/{$model->tenant_id}/products/{$model->id}", 'public');
            $size = @getimagesize($file->getRealPath());

            $model->images()->create([
                'disk' => 'public',
                'path' => $path,
                'width' => is_array($size) ? $size[0] : null,
                'height' => is_array($size) ? $size[1] : null,
                'position' => $position++,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Images uploaded.')]);

        return back();
    }

    public function update(Request $request, int $product, int $image): RedirectResponse
    {
        $model = Product::findOrFail($product);

        $model->images()->findOrFail($image)->update(
            $request->validate(['alt' => ['nullable', 'string', 'max:255']])
        );

        return back();
    }

    public function reorder(Request $request, int $product): RedirectResponse
    {
        $model = Product::findOrFail($product);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ])['ids'];

        foreach (array_values($ids) as $position => $id) {
            $model->images()->whereKey($id)->update(['position' => $position]);
        }

        return back();
    }

    public function destroy(int $product, int $image): RedirectResponse
    {
        Product::findOrFail($product)->images()->findOrFail($image)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Image removed.')]);

        return back();
    }
}
