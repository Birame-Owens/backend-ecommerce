<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BanniereAccueil;
use App\Http\Requests\Admin\BanniereRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BanniereController extends Controller
{
    private function formatBanniere(BanniereAccueil $banniere): array
    {
        return [
            'id' => $banniere->id,
            'titre' => $banniere->titre,
            'sous_titre' => $banniere->sous_titre,
            'image' => $banniere->image_url,
            'lien_url' => $banniere->lien_url,
            'ordre_affichage' => $banniere->ordre_affichage,
            'est_active' => $banniere->est_active,
            'created_at' => $banniere->created_at->format('d/m/Y H:i'),
            'updated_at' => $banniere->updated_at->format('d/m/Y H:i'),
        ];
    }

    /**
     * Liste toutes les bannières (actives + inactives), triées par ordre d'affichage
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $bannieres = BanniereAccueil::orderBy('ordre_affichage')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'bannieres' => $bannieres->map(fn($b) => $this->formatBanniere($b)),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des bannières', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des bannières'
            ], 500);
        }
    }

    /**
     * Créer une nouvelle bannière
     */
    public function store(BanniereRequest $request): JsonResponse
    {
        try {
            $validatedData = $request->validated();

            if ($request->hasFile('image')) {
                $validatedData['image'] = $request->file('image')->store('bannieres', 'public');
            }

            $validatedData['ordre_affichage'] = $validatedData['ordre_affichage']
                ?? ((int) BanniereAccueil::max('ordre_affichage') + 1);

            $banniere = BanniereAccueil::create($validatedData);

            $this->clearApiResponseCache();

            Log::info('Nouvelle bannière créée', [
                'banniere_id' => $banniere->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bannière créée avec succès',
                'data' => ['banniere' => $this->formatBanniere($banniere)]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la bannière', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la bannière'
            ], 500);
        }
    }

    /**
     * Mettre à jour une bannière
     */
    public function update(BanniereRequest $request, BanniereAccueil $banniere): JsonResponse
    {
        try {
            $validatedData = $request->validated();

            if ($request->hasFile('image')) {
                if ($banniere->image && Storage::disk('public')->exists($banniere->image)) {
                    Storage::disk('public')->delete($banniere->image);
                }
                $validatedData['image'] = $request->file('image')->store('bannieres', 'public');
            }

            $banniere->update($validatedData);

            $this->clearApiResponseCache();

            Log::info('Bannière mise à jour', [
                'banniere_id' => $banniere->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bannière mise à jour avec succès',
                'data' => ['banniere' => $this->formatBanniere($banniere)]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la bannière', [
                'banniere_id' => $banniere->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la bannière'
            ], 500);
        }
    }

    /**
     * Supprimer une bannière
     */
    public function destroy(BanniereAccueil $banniere): JsonResponse
    {
        try {
            if ($banniere->image && Storage::disk('public')->exists($banniere->image)) {
                Storage::disk('public')->delete($banniere->image);
            }

            $banniere->delete();

            $this->clearApiResponseCache();

            Log::info('Bannière supprimée', [
                'banniere_id' => $banniere->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bannière supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la bannière', [
                'banniere_id' => $banniere->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la bannière'
            ], 500);
        }
    }

    /**
     * Activer/Désactiver une bannière
     */
    public function toggleStatus(BanniereAccueil $banniere): JsonResponse
    {
        try {
            $banniere->update(['est_active' => !$banniere->est_active]);

            $this->clearApiResponseCache();

            $status = $banniere->est_active ? 'activée' : 'désactivée';

            Log::info("Bannière {$status}", [
                'banniere_id' => $banniere->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => "Bannière {$status} avec succès",
                'data' => ['banniere' => $this->formatBanniere($banniere)]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du changement de statut de la bannière', [
                'banniere_id' => $banniere->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut'
            ], 500);
        }
    }

    /**
     * Réordonner les bannières
     * Body: { "ordre": [id1, id2, id3, ...] } dans le nouvel ordre voulu
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $ids = $request->validate([
                'ordre' => 'required|array',
                'ordre.*' => 'integer|exists:bannieres_accueil,id',
            ])['ordre'];

            foreach ($ids as $index => $id) {
                BanniereAccueil::where('id', $id)->update(['ordre_affichage' => $index]);
            }

            $this->clearApiResponseCache();

            return response()->json(['success' => true, 'message' => 'Ordre mis à jour avec succès']);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la réorganisation des bannières', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réorganisation des bannières'
            ], 500);
        }
    }

    private function clearApiResponseCache(): void
    {
        Cache::forget('client_home_data');
        try {
            Cache::tags(['api_responses'])->flush();
        } catch (\Throwable $e) {
            Log::debug('API response cache tags not flushed', ['error' => $e->getMessage()]);
        }
    }
}
