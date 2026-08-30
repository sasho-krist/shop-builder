<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Fills a store with a believable wellness catalogue — 10 products with
 * generated cover images, variants and a few categories — so the storefront can
 * be reviewed with real content. Targets the currently bound tenant, or the
 * first one. Safe to re-run; existing products (by slug) are skipped.
 */
class DemoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::current() ?? Tenant::query()->firstOrFail();
        Tenant::setCurrent($tenant);

        /** @var array<string, Category> $categories */
        $categories = [];
        foreach (['Protein', 'Vitamins', 'Superfoods', 'Wellness'] as $name) {
            $categories[$name] = Category::query()->firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'position' => 0],
            );
        }

        foreach ($this->catalogue() as $index => $item) {
            if (Product::query()->where('slug', $item['slug'])->exists()) {
                continue;
            }

            $product = Product::create([
                'title' => $item['title'],
                'slug' => $item['slug'],
                'description' => $item['description'],
                'status' => 'active',
                'options' => $item['options'] ?? null,
                'seo_title' => $item['title'],
                'seo_description' => Str::limit($item['description'], 150),
            ]);

            foreach ($item['variants'] as $position => $variant) {
                $product->variants()->create([
                    'name' => $variant['name'],
                    'sku' => $variant['sku'],
                    'price' => $variant['price'],
                    'compare_at_price' => $variant['compare_at_price'] ?? null,
                    'stock_quantity' => $variant['stock'],
                    'position' => $position,
                    'options' => $variant['options'] ?? null,
                ]);
            }

            $categoryIds = [];
            /** @var list<string> $names */
            $names = $item['categories'];
            foreach ($names as $name) {
                $categoryIds[] = $categories[$name]->id;
            }
            $product->categories()->sync($categoryIds);

            $path = "products/{$product->slug}.svg";
            Storage::disk('public')->put(
                $path,
                $this->coverSvg($item['title'], $item['accent'], $index),
            );
            $product->images()->create([
                'disk' => 'public',
                'path' => $path,
                'alt' => $item['title'],
                'width' => 800,
                'height' => 800,
                'position' => 0,
            ]);
        }

        Tenant::forgetCurrent();
    }

    /**
     * @return list<array{
     *     title: string,
     *     slug: string,
     *     description: string,
     *     accent: string,
     *     categories: list<string>,
     *     options?: list<array{name: string, values: list<string>}>,
     *     variants: list<array{name: string, sku: string, price: string, stock: int, compare_at_price?: string, options?: array<string, string>}>
     * }>
     */
    private function catalogue(): array
    {
        return [
            [
                'title' => 'Whey Protein Isolate',
                'slug' => 'whey-protein-isolate',
                'description' => 'Grass-fed 90% protein isolate, 24g per serving. Fast-absorbing and low in lactose.',
                'accent' => '#10b981',
                'categories' => ['Protein'],
                'options' => [
                    ['name' => 'Flavour', 'values' => ['Vanilla', 'Chocolate', 'Unflavoured']],
                    ['name' => 'Size', 'values' => ['1kg', '2.5kg']],
                ],
                'variants' => [
                    ['name' => 'Vanilla / 1kg', 'sku' => 'WPI-VAN-1', 'price' => '44.90', 'stock' => 60, 'options' => ['Flavour' => 'Vanilla', 'Size' => '1kg']],
                    ['name' => 'Vanilla / 2.5kg', 'sku' => 'WPI-VAN-25', 'price' => '99.90', 'stock' => 30, 'options' => ['Flavour' => 'Vanilla', 'Size' => '2.5kg']],
                    ['name' => 'Chocolate / 1kg', 'sku' => 'WPI-CHO-1', 'price' => '44.90', 'stock' => 55, 'options' => ['Flavour' => 'Chocolate', 'Size' => '1kg']],
                    ['name' => 'Chocolate / 2.5kg', 'sku' => 'WPI-CHO-25', 'price' => '99.90', 'stock' => 25, 'options' => ['Flavour' => 'Chocolate', 'Size' => '2.5kg']],
                    ['name' => 'Unflavoured / 1kg', 'sku' => 'WPI-UNF-1', 'price' => '42.90', 'stock' => 40, 'options' => ['Flavour' => 'Unflavoured', 'Size' => '1kg']],
                    ['name' => 'Unflavoured / 2.5kg', 'sku' => 'WPI-UNF-25', 'price' => '95.90', 'stock' => 18, 'options' => ['Flavour' => 'Unflavoured', 'Size' => '2.5kg']],
                ],
            ],
            [
                'title' => 'Plant Protein Blend',
                'slug' => 'plant-protein-blend',
                'description' => 'Pea, hemp and pumpkin protein with a complete amino acid profile. Vegan and gut-friendly.',
                'accent' => '#22c55e',
                'categories' => ['Protein'],
                'options' => [['name' => 'Flavour', 'values' => ['Cacao', 'Salted Caramel']]],
                'variants' => [
                    ['name' => 'Cacao', 'sku' => 'PPB-CAC', 'price' => '38.50', 'compare_at_price' => '44.00', 'stock' => 42, 'options' => ['Flavour' => 'Cacao']],
                    ['name' => 'Salted Caramel', 'sku' => 'PPB-SC', 'price' => '38.50', 'compare_at_price' => '44.00', 'stock' => 37, 'options' => ['Flavour' => 'Salted Caramel']],
                ],
            ],
            [
                'title' => 'Creatine Monohydrate',
                'slug' => 'creatine-monohydrate',
                'description' => 'Micronised creatine monohydrate, 5g per scoop. Unflavoured and mixes clear.',
                'accent' => '#0ea5e9',
                'categories' => ['Wellness'],
                'variants' => [
                    ['name' => '300g', 'sku' => 'CRE-300', 'price' => '19.90', 'stock' => 80],
                    ['name' => '500g', 'sku' => 'CRE-500', 'price' => '27.90', 'stock' => 50],
                ],
            ],
            [
                'title' => 'Daily Multivitamin',
                'slug' => 'daily-multivitamin',
                'description' => '25 essential vitamins and minerals in a single once-a-day capsule.',
                'accent' => '#f59e0b',
                'categories' => ['Vitamins'],
                'variants' => [
                    ['name' => '60 capsules', 'sku' => 'MV-60', 'price' => '16.90', 'stock' => 120],
                    ['name' => '180 capsules', 'sku' => 'MV-180', 'price' => '39.90', 'stock' => 45],
                ],
            ],
            [
                'title' => 'Vitamin D3 + K2',
                'slug' => 'vitamin-d3-k2',
                'description' => '1000 IU vitamin D3 with 75mcg K2 (MK-7) in MCT oil for absorption.',
                'accent' => '#eab308',
                'categories' => ['Vitamins'],
                'variants' => [
                    ['name' => '30ml drops', 'sku' => 'D3K2-30', 'price' => '14.50', 'stock' => 95],
                ],
            ],
            [
                'title' => 'Omega-3 Fish Oil',
                'slug' => 'omega-3-fish-oil',
                'description' => 'High-strength EPA & DHA from sustainably sourced wild fish. 90 softgels.',
                'accent' => '#3b82f6',
                'categories' => ['Wellness'],
                'variants' => [
                    ['name' => '90 softgels', 'sku' => 'O3-90', 'price' => '21.90', 'stock' => 70],
                ],
            ],
            [
                'title' => 'Magnesium Glycinate',
                'slug' => 'magnesium-glycinate',
                'description' => 'Gentle, highly bioavailable magnesium for muscle recovery and sleep. 120 capsules.',
                'accent' => '#8b5cf6',
                'categories' => ['Wellness'],
                'variants' => [
                    ['name' => '120 capsules', 'sku' => 'MAG-120', 'price' => '18.90', 'stock' => 65],
                ],
            ],
            [
                'title' => 'Organic Spirulina',
                'slug' => 'organic-spirulina',
                'description' => 'Nutrient-dense blue-green algae, cold-pressed into tablets. Rich in iron and B12.',
                'accent' => '#14b8a6',
                'categories' => ['Superfoods'],
                'variants' => [
                    ['name' => '200 tablets', 'sku' => 'SPI-200', 'price' => '15.90', 'stock' => 58],
                    ['name' => '500 tablets', 'sku' => 'SPI-500', 'price' => '32.90', 'stock' => 22],
                ],
            ],
            [
                'title' => 'Cacao & Maca Blend',
                'slug' => 'cacao-maca-blend',
                'description' => 'Raw Peruvian cacao with maca root — a warming, caffeine-free energy boost.',
                'accent' => '#a16207',
                'categories' => ['Superfoods'],
                'variants' => [
                    ['name' => '250g pouch', 'sku' => 'CM-250', 'price' => '17.50', 'stock' => 48],
                ],
            ],
            [
                'title' => 'Electrolyte Hydration',
                'slug' => 'electrolyte-hydration',
                'description' => 'Sugar-free electrolyte mix with sodium, potassium and magnesium. 30 sachets.',
                'accent' => '#06b6d4',
                'categories' => ['Wellness'],
                'options' => [['name' => 'Flavour', 'values' => ['Citrus', 'Berry', 'Watermelon']]],
                'variants' => [
                    ['name' => 'Citrus', 'sku' => 'EL-CIT', 'price' => '24.90', 'stock' => 90, 'options' => ['Flavour' => 'Citrus']],
                    ['name' => 'Berry', 'sku' => 'EL-BER', 'price' => '24.90', 'stock' => 84, 'options' => ['Flavour' => 'Berry']],
                    ['name' => 'Watermelon', 'sku' => 'EL-WAT', 'price' => '24.90', 'stock' => 76, 'options' => ['Flavour' => 'Watermelon']],
                ],
            ],
        ];
    }

    private function coverSvg(string $title, string $accent, int $index): string
    {
        $words = preg_split('/\s+/', $title) ?: [$title];
        $lines = '';
        $y = 430 - (count($words) - 1) * 34;
        foreach ($words as $word) {
            $lines .= '<text x="400" y="'.$y.'" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="52" font-weight="700" fill="#0b0b12">'.htmlspecialchars($word, ENT_QUOTES).'</text>';
            $y += 68;
        }

        $rotation = ($index * 37) % 360;

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{$accent}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <g transform="rotate({$rotation} 400 400)" opacity="0.25">
    <circle cx="400" cy="400" r="260" fill="none" stroke="#0b0b12" stroke-width="2"/>
    <circle cx="400" cy="400" r="180" fill="none" stroke="#0b0b12" stroke-width="2"/>
  </g>
  <rect x="120" y="300" width="560" height="200" rx="24" fill="#ffffff" opacity="0.82"/>
  {$lines}
</svg>
SVG;
    }
}
