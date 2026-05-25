<?php
// ================================================================
// 📝 FICHIER: app/Http/Resources/Admin/UserResource.php
// ================================================================

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'photo_profil' => $this->photo_profil ? asset('storage/' . $this->photo_profil) : null,
            'role' => $this->role,
            'statut' => $this->statut,
            'derniere_connexion' => $this->derniere_connexion?->format('Y-m-d H:i:s'),
            'nombre_connexions' => $this->nombre_connexions,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
            
            // Permissions et capacités
            'permissions' => [
                'can_manage_products' => $this->isAdmin(),
                'can_manage_orders' => $this->isAdmin(),
                'can_manage_users' => $this->isAdmin(),
                'can_view_dashboard' => $this->isAdmin(),
            ],
            
            // Informations complémentaires pour l'interface
            'display_name' => $this->getDisplayName(),
            'initials' => $this->getInitials(),
            'status_badge' => $this->getStatusBadge(),
        ];
    }

    /**
     * Vérifier si l'utilisateur est admin
     */
    private function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Obtenir le nom d'affichage
     */
    private function getDisplayName(): string
    {
        return $this->name ?: 'Utilisateur';
    }

    /**
     * Obtenir les initiales pour l'avatar
     */
    private function getInitials(): string
    {
        $words = explode(' ', $this->name);
        if (count($words) >= 2) {
            return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
        }
        return strtoupper(substr($this->name, 0, 2));
    }

    /**
     * Obtenir le badge de statut pour l'interface
     */
    private function getStatusBadge(): array
    {
        return match ($this->statut) {
            'actif' => [
                'text' => 'Actif',
                'color' => 'green',
                'icon' => 'check-circle'
            ],
            'inactif' => [
                'text' => 'Inactif',
                'color' => 'gray',
                'icon' => 'pause-circle'
            ],
            'suspendu' => [
                'text' => 'Suspendu',
                'color' => 'red',
                'icon' => 'x-circle'
            ],
            default => [
                'text' => 'Inconnu',
                'color' => 'gray',
                'icon' => 'question-circle'
            ]
        };
    }

    /**
     * Données additionnelles pour la réponse
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'timestamp' => now()->toISOString(),
                'version' => '1.0'
            ]
        ];
    }
}