<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShopSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ShopSettingController extends Controller
{
    /**
     * Retourne tous les paramètres de la boutique.
     */
    public function index(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data'    => ShopSetting::getAllGrouped(),
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur récupération paramètres boutique', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paramètres.',
            ], 500);
        }
    }

    /**
     * Met à jour un ou plusieurs paramètres.
     *
     * Body attendu : { "settings": { "boutique_nom": "...", "social_instagram": "..." } }
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'settings'   => 'required|array|min:1',
                'settings.*' => 'nullable|string|max:500',
            ]);

            foreach ($validated['settings'] as $key => $value) {
                $group = ShopSetting::getGroup($key);
                if ($group === null) {
                    continue; // ignorer les clés inconnues
                }
                ShopSetting::setValue($key, $value, $group);
            }

            Log::info('Paramètres boutique mis à jour', [
                'keys'    => array_keys($validated['settings']),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Paramètres mis à jour avec succès.',
                'data'    => ShopSetting::getAllGrouped(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour paramètres boutique', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour des paramètres.',
            ], 500);
        }
    }

    /**
     * Change le mot de passe de l'administrateur connecté.
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'current_password'          => 'required|string',
                'new_password'              => 'required|string|min:8|confirmed',
                'new_password_confirmation' => 'required|string',
            ], [
                'new_password.min'       => 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
                'new_password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
            ]);

            $user = auth()->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le mot de passe actuel est incorrect.',
                ], 422);
            }

            $user->update(['password' => Hash::make($validated['new_password'])]);

            Log::info('Mot de passe admin modifié', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe modifié avec succès.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur changement mot de passe admin', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mot de passe.',
            ], 500);
        }
    }
}
