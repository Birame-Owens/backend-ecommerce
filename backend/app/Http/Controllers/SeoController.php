<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SeoController extends Controller
{
    public function robots()
    {
        $sitemapUrl = url('/sitemap.xml');
        $adminPath = '/' . (trim((string) env('ADMIN_PATH', 'ndeya-backoffice'), '/') ?: 'ndeya-backoffice');

        return response(
            "User-agent: *\n" .
            "Allow: /\n" .
            "Disallow: /admin\n" .
            "Disallow: {$adminPath}\n" .
            "Disallow: /api\n" .
            "Disallow: /checkout\n" .
            "Disallow: /cart\n" .
            "Disallow: /wishlist\n" .
            "Disallow: /profile\n" .
            "Disallow: /account\n\n" .
            "Sitemap: {$sitemapUrl}\n",
            200,
            ['Content-Type' => 'text/plain; charset=UTF-8']
        );
    }

    public function sitemap()
    {
        $urls = collect([
            $this->urlEntry(url('/'), now(), 'daily', '1.0'),
            $this->urlEntry(url('/shop'), now(), 'daily', '0.9'),
        ]);

        Category::query()
            ->where('est_active', true)
            ->orderByDesc('updated_at')
            ->get(['slug', 'updated_at'])
            ->each(function (Category $category) use ($urls) {
                $urls->push($this->urlEntry(
                    url("/categories/{$category->slug}"),
                    $category->updated_at,
                    'weekly',
                    '0.8'
                ));
            });

        Produit::query()
            ->where('est_visible', true)
            ->orderByDesc('updated_at')
            ->get(['slug', 'updated_at'])
            ->each(function (Produit $produit) use ($urls) {
                $urls->push($this->urlEntry(
                    url("/products/{$produit->slug}"),
                    $produit->updated_at,
                    'weekly',
                    '0.9'
                ));
            });

        $xml = $this->renderSitemapXml($urls);

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    public function clientApp(Request $request)
    {
        return view('client.client', [
            'seo' => $this->seoForPath(trim($request->path(), '/')),
        ]);
    }

    private function seoForPath(string $path): array
    {
        $defaults = $this->defaultSeo();

        if (preg_match('#^products/([^/]+)$#', $path, $matches)) {
            $produit = Produit::with(['category', 'images_produits'])
                ->where('slug', $matches[1])
                ->where('est_visible', true)
                ->first();

            if ($produit) {
                $image = $produit->images_produits
                    ->where('est_visible', true)
                    ->sortByDesc('est_principale')
                    ->first()?->url;

                return array_merge($defaults, [
                    'title' => $produit->meta_titre ?: "{$produit->nom} | NDEYA SHOP",
                    'description' => $this->limitDescription($produit->meta_description ?: $produit->description_courte ?: $produit->description),
                    'keywords' => $this->keywordsFromProduct($produit),
                    'canonical' => url("/products/{$produit->slug}"),
                    'image' => $image ?: $this->absoluteAsset($produit->image_principale),
                    'type' => 'product',
                    'schema' => $this->productSchema($produit, $image ?: $this->absoluteAsset($produit->image_principale)),
                ]);
            }
        }

        if (preg_match('#^categories/([^/]+)$#', $path, $matches)) {
            $category = Category::where('slug', $matches[1])
                ->where('est_active', true)
                ->first();

            if ($category) {
                return array_merge($defaults, [
                    'title' => "{$category->nom} | NDEYA SHOP",
                    'description' => $this->limitDescription($category->description ?: "Decouvrez notre selection {$category->nom} chez NDEYA SHOP au Senegal."),
                    'keywords' => "{$category->nom}, mode senegalaise, boutique en ligne Senegal, NDEYA SHOP",
                    'canonical' => url("/categories/{$category->slug}"),
                    'image' => $this->absoluteAsset($category->image) ?: $defaults['image'],
                ]);
            }
        }

        $pageSeo = [
            'shop' => [
                'title' => 'Boutique NDEYA SHOP | Mode, robes et accessoires au Senegal',
                'description' => 'Explorez les robes, tissus, accessoires et creations NDEYA SHOP. Commandez en ligne au Senegal.',
                'canonical' => url('/shop'),
            ],
        ];

        return array_merge($defaults, $pageSeo[$path] ?? []);
    }

    private function defaultSeo(): array
    {
        $description = 'NDEYA SHOP est une boutique de mode au Senegal pour robes, tissus, accessoires et creations elegantes. Commandez en ligne facilement.';

        return [
            'title' => 'NDEYA SHOP | Mode, robes et creations au Senegal',
            'description' => $description,
            'keywords' => 'NDEYA SHOP, mode Senegal, robes Senegal, boutique en ligne Dakar, tissus, accessoires, creation sur mesure',
            'canonical' => url('/'),
            'image' => asset('assets/images/ndeya.jpg'),
            'type' => 'website',
            'schema' => $this->organizationSchema(),
        ];
    }

    private function urlEntry(string $loc, $lastmod, string $changefreq, string $priority): array
    {
        return [
            'loc' => $loc,
            'lastmod' => optional($lastmod)->toAtomString() ?: now()->toAtomString(),
            'changefreq' => $changefreq,
            'priority' => $priority,
        ];
    }

    private function renderSitemapXml($urls): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $url) {
            $xml .= "    <url>\n";
            $xml .= '        <loc>' . e($url['loc']) . "</loc>\n";
            $xml .= '        <lastmod>' . e($url['lastmod']) . "</lastmod>\n";
            $xml .= '        <changefreq>' . e($url['changefreq']) . "</changefreq>\n";
            $xml .= '        <priority>' . e($url['priority']) . "</priority>\n";
            $xml .= "    </url>\n";
        }

        $xml .= "</urlset>\n";

        return $xml;
    }

    private function limitDescription(?string $value): string
    {
        return Str::limit(trim(strip_tags((string) $value)), 155, '');
    }

    private function keywordsFromProduct(Produit $produit): string
    {
        $tags = $produit->tags;

        if (is_string($tags)) {
            $decoded = json_decode($tags, true);
            $tags = is_array($decoded) ? $decoded : [$tags];
        }

        return collect([
            $produit->nom,
            $produit->category?->nom,
            'NDEYA SHOP',
            'mode Senegal',
            'boutique en ligne Senegal',
        ])->merge(is_array($tags) ? $tags : [])
            ->filter()
            ->unique()
            ->implode(', ');
    }

    private function absoluteAsset(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset(ltrim($path, '/'));
    }

    private function organizationSchema(): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => 'NDEYA SHOP',
            'url' => url('/'),
            'logo' => asset('favicon.ico'),
            'sameAs' => array_values(array_filter([
                config('app.instagram_url'),
                config('app.tiktok_url'),
            ])),
        ];
    }

    private function productSchema(Produit $produit, ?string $image): array
    {
        $price = $produit->prix_promo ?: $produit->prix;

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $produit->nom,
            'description' => $this->limitDescription($produit->description_courte ?: $produit->description),
            'image' => array_values(array_filter([$image])),
            'brand' => [
                '@type' => 'Brand',
                'name' => 'NDEYA SHOP',
            ],
            'offers' => [
                '@type' => 'Offer',
                'url' => url("/products/{$produit->slug}"),
                'priceCurrency' => 'XOF',
                'price' => (string) round((float) $price),
                'availability' => $produit->stock_disponible > 0 || !$produit->gestion_stock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            ],
        ];
    }
}
