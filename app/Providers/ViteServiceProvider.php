<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\HtmlString;
use Illuminate\Support\ServiceProvider;

class ViteServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Blade::directive('vite', function ($expression) {
            return "<?php echo app(\\App\\Providers\\ViteServiceProvider::class)->generateTags({$expression}); ?>";
        });

        $this->app->singleton(self::class, function () {
            return $this;
        });
    }

    public function generateTags($entrypoints)
    {
        $entrypoints = is_array($entrypoints) ? $entrypoints : [$entrypoints];
        $devServerUrl = 'http://localhost:5173';

        // Check if Vite dev server is running
        if (file_exists(public_path('hot'))) {
            $html = '<script type="module" src="' . $devServerUrl . '/@vite/client"></script>';
            foreach ($entrypoints as $entry) {
                $html .= '<script type="module" src="' . $devServerUrl . '/' . $entry . '"></script>';
            }
            return new HtmlString($html);
        }

        // Production: read manifest
        $manifestPath = public_path('build/manifest.json');
        if (!file_exists($manifestPath)) {
            return new HtmlString('<!-- Vite manifest not found. Run: npm run build -->');
        }

        $manifest = json_decode(file_get_contents($manifestPath), true);
        $html = '';

        foreach ($entrypoints as $entry) {
            if (!isset($manifest[$entry])) continue;
            $asset = $manifest[$entry];

            if (isset($asset['css'])) {
                foreach ($asset['css'] as $css) {
                    $html .= '<link rel="stylesheet" href="/build/' . $css . '">';
                }
            }
            if (isset($asset['file'])) {
                $ext = pathinfo($asset['file'], PATHINFO_EXTENSION);
                if ($ext === 'css') {
                    $html .= '<link rel="stylesheet" href="/build/' . $asset['file'] . '">';
                } else {
                    $html .= '<script type="module" src="/build/' . $asset['file'] . '"></script>';
                }
            }
        }

        return new HtmlString($html);
    }
}
