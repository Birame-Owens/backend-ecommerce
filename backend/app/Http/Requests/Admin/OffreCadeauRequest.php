<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class OffreCadeauRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $offre = $this->route('offreCadeau');

        return [
            'produit_declencheur_id' => [
                'required',
                'integer',
                Rule::exists('produits', 'id')->whereNull('deleted_at'),
                // Une seule offre par produit déclencheur.
                Rule::unique('offres_cadeaux', 'produit_declencheur_id')->ignore($offre?->id),
            ],
            'produit_offert_id' => [
                'required',
                'integer',
                Rule::exists('produits', 'id')->whereNull('deleted_at'),
            ],
            'quantite_declencheur' => ['required', 'integer', 'min:1', 'max:100'],
            'quantite_offerte' => ['required', 'integer', 'min:1', 'max:100'],
            'couleur_offerte' => ['nullable', 'string', 'max:100'],
            'taille_offerte' => ['nullable', 'string', 'max:100'],
            'est_active' => ['boolean'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
        ];
    }

    public function messages(): array
    {
        return [
            'produit_declencheur_id.required' => 'Choisissez le produit à acheter.',
            'produit_declencheur_id.exists' => 'Le produit à acheter est introuvable.',
            'produit_declencheur_id.unique' => 'Ce produit a déjà une offre cadeau. Modifiez l\'offre existante.',
            'produit_offert_id.required' => 'Choisissez le produit offert.',
            'produit_offert_id.exists' => 'Le produit offert est introuvable.',
            'quantite_declencheur.min' => 'La quantité à acheter doit être d\'au moins 1.',
            'quantite_offerte.min' => 'La quantité offerte doit être d\'au moins 1.',
            'date_fin.after_or_equal' => 'La date de fin doit être après la date de début.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'est_active' => $this->boolean('est_active', true),
            'couleur_offerte' => $this->filled('couleur_offerte') ? $this->input('couleur_offerte') : null,
            'taille_offerte' => $this->filled('taille_offerte') ? $this->input('taille_offerte') : null,
        ]);
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
