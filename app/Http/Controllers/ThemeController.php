<?php

namespace App\Http\Controllers;

use App\Http\Requests\ThemeRequest;
use App\Models\Theme;
use App\Support\Theme\ThemePresets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ThemeController extends Controller
{
    public function index(): Response
    {
        $themes = Theme::query()
            ->orderByDesc('is_active')
            ->latest()
            ->get()
            ->map(fn (Theme $theme): array => [
                'id' => $theme->id,
                'name' => $theme->name,
                'is_active' => $theme->is_active,
                'tokens' => $theme->tokens,
            ]);

        return Inertia::render('admin/themes/index', [
            'themes' => $themes,
            'presets' => $this->presetList(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'preset' => ['required', Rule::in(array_keys(ThemePresets::all()))],
        ]);

        $theme = Theme::create([
            'name' => $data['name'],
            'tokens' => ThemePresets::tokens($data['preset']),
            'is_active' => false,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Theme created.']);

        return to_route('themes.edit', $theme);
    }

    public function edit(int $theme): Response
    {
        $model = Theme::findOrFail($theme);

        return Inertia::render('admin/themes/edit', [
            'theme' => [
                'id' => $model->id,
                'name' => $model->name,
                'is_active' => $model->is_active,
                'tokens' => $model->tokens,
            ],
            'presets' => $this->presetList(),
            'fonts' => ThemePresets::FONTS,
            'buttonStyles' => ThemePresets::BUTTON_STYLES,
        ]);
    }

    public function update(ThemeRequest $request, int $theme): RedirectResponse
    {
        Theme::findOrFail($theme)->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Theme saved.']);

        return back();
    }

    public function activate(int $theme): RedirectResponse
    {
        Theme::findOrFail($theme)->activate();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Theme activated.']);

        return back();
    }

    public function destroy(int $theme): RedirectResponse
    {
        $model = Theme::findOrFail($theme);

        if (Theme::query()->count() <= 1) {
            return back()->withErrors(['theme' => 'You need at least one theme.']);
        }

        $wasActive = $model->is_active;
        $model->delete();

        if ($wasActive) {
            Theme::query()->latest()->first()?->activate();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Theme deleted.']);

        return to_route('themes.index');
    }

    /**
     * @return array<int, array{key: string, label: string, tokens: array<string, mixed>}>
     */
    private function presetList(): array
    {
        $list = [];

        foreach (ThemePresets::all() as $key => $preset) {
            $list[] = [
                'key' => $key,
                'label' => $preset['label'],
                'tokens' => $preset['tokens'],
            ];
        }

        return $list;
    }
}
