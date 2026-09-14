<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BanniereRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isCreate = $this->isMethod('post') && !$this->route('banniere');

        return [
            'titre' => [
                'nullable',
                'string',
                'max:255'
            ],
            'sous_titre' => [
                'nullable',
                'string',
                'max:500'
            ],
            'image' => [
                $isCreate ? 'required' : 'nullable',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:4096' // 4MB max
            ],
            'lien_url' => [
                'nullable',
                'string',
                'max:255'
            ],
            'ordre_affichage' => [
                'nullable',
                'integer',
                'min:0',
                'max:999'
            ],
            'est_active' => [
                'boolean'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'titre.string' => 'Le titre doit être une chaîne de caractères.',
            'titre.max' => 'Le titre ne peut pas dépasser 255 caractères.',

            'sous_titre.string' => 'Le sous-titre doit être une chaîne de caractères.',
            'sous_titre.max' => 'Le sous-titre ne peut pas dépasser 500 caractères.',

            'image.required' => 'L\'image de la bannière est obligatoire.',
            'image.image' => 'Le fichier doit être une image.',
            'image.mimes' => 'L\'image doit être au format JPEG, PNG, JPG ou WebP.',
            'image.max' => 'L\'image ne peut pas dépasser 4 MB.',

            'lien_url.string' => 'Le lien doit être une chaîne de caractères.',
            'lien_url.max' => 'Le lien ne peut pas dépasser 255 caractères.',

            'ordre_affichage.integer' => 'L\'ordre d\'affichage doit être un nombre entier.',
            'ordre_affichage.min' => 'L\'ordre d\'affichage ne peut pas être négatif.',
            'ordre_affichage.max' => 'L\'ordre d\'affichage ne peut pas dépasser 999.',

            'est_active.boolean' => 'Le statut actif doit être vrai ou faux.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'est_active' => $this->boolean('est_active', true),
        ]);
    }

    protected function failedValidation(Validator $validator)
    {
        if ($this->expectsJson()) {
            throw new HttpResponseException(
                response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422)
            );
        }

        parent::failedValidation($validator);
    }
}
