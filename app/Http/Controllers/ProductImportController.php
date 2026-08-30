<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductImportController extends Controller
{
    /** Product fields a CSV column can be mapped to. */
    public const FIELDS = [
        'title', 'slug', 'description', 'status',
        'price', 'sku', 'stock', 'category',
    ];

    public function show(): Response
    {
        return Inertia::render('admin/products/import', ['fields' => self::FIELDS]);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:5120']]);

        [$headers, $rows] = $this->read($request->file('file')->getRealPath(), 5);

        return response()->json(['headers' => $headers, 'rows' => $rows]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'mapping' => ['required', 'array'],
            'mapping.title' => ['required', 'string'],
            'mapping.*' => ['nullable', 'string'],
        ]);

        /** @var array<string, string> $mapping */
        $mapping = $data['mapping'];
        [$headers, $rows] = $this->read($request->file('file')->getRealPath(), PHP_INT_MAX);

        $columnFor = [];
        foreach (self::FIELDS as $field) {
            $header = $mapping[$field] ?? null;
            $position = $header === null ? false : array_search($header, $headers, true);
            $columnFor[$field] = $position === false ? null : $position;
        }

        $imported = 0;
        $errors = 0;
        $tenantId = Tenant::currentOrFail()->id;
        $categories = Category::query()->pluck('id', 'name');

        foreach ($rows as $row) {
            $get = function (string $field) use ($row, $columnFor): string {
                $i = $columnFor[$field];

                return $i === null ? '' : trim((string) ($row[$i] ?? ''));
            };

            $title = $get('title');
            if ($title === '') {
                $errors++;

                continue;
            }

            try {
                DB::transaction(function () use ($get, $title, $tenantId, $categories): void {
                    $slug = $get('slug') !== '' ? $get('slug') : Str::slug($title);
                    $status = in_array($get('status'), Product::STATUSES, true) ? $get('status') : 'draft';
                    $price = $get('price');

                    $product = Product::updateOrCreate(
                        ['tenant_id' => $tenantId, 'slug' => $slug],
                        [
                            'title' => $title,
                            'description' => $get('description') !== '' ? $get('description') : null,
                            'status' => $status,
                        ]
                    );

                    $product->variants()->firstOrNew(['name' => 'Default'])->fill([
                        'price' => is_numeric($price) ? $price : '0',
                        'sku' => $get('sku') !== '' ? $get('sku') : null,
                        'stock_quantity' => (int) $get('stock'),
                    ])->save();

                    $categoryName = $get('category');
                    if ($categoryName !== '' && $categories->has($categoryName)) {
                        $product->categories()->syncWithoutDetaching([$categories->get($categoryName)]);
                    }
                });
                $imported++;
            } catch (\Throwable) {
                $errors++;
            }
        }

        Inertia::flash('toast', [
            'type' => $errors > 0 ? 'warning' : 'success',
            'message' => $errors > 0
                ? __('Imported :count products (:skipped rows skipped).', ['count' => $imported, 'skipped' => $errors])
                : __('Imported :count products.', ['count' => $imported]),
        ]);

        return to_route('products.index');
    }

    /**
     * @return array{0: list<string>, 1: list<list<string>>}
     */
    private function read(string $path, int $limit): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return [[], []];
        }

        $headerRow = fgetcsv($handle);
        $headers = is_array($headerRow)
            ? array_map(fn ($h): string => trim((string) $h), $headerRow)
            : [];

        $rows = [];
        while (count($rows) < $limit) {
            $row = fgetcsv($handle);
            if (! is_array($row)) {
                break;
            }
            $rows[] = array_map(fn ($c): string => (string) $c, $row);
        }

        fclose($handle);

        return [$headers, $rows];
    }
}
