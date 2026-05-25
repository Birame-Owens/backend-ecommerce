<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Class User
 * 
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $telephone
 * @property string|null $photo_profil
 * @property string $role
 * @property string $statut
 * @property Carbon|null $derniere_connexion
 * @property int $nombre_connexions
 * @property string|null $deleted_at
 * 
 * @property Collection|Tailleur[] $tailleurs
 * @property Collection|Client[] $clients
 * @property Collection|Stock[] $stocks
 *
 * @package App\Models
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;
    
    protected $table = 'users';

    protected $casts = [
        'email_verified_at' => 'datetime',
        'derniere_connexion' => 'datetime',
        'nombre_connexions' => 'int',
        'password' => 'hashed',
    ];

    protected $hidden = [
        'password',
        'remember_token'
    ];

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'remember_token',
        'telephone',
        'photo_profil',
        'role',
        'statut',
        'derniere_connexion',
        'nombre_connexions'
    ];

    public function tailleurs()
    {
        return $this->hasMany(Tailleur::class);
    }

    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function client()
    {
        return $this->hasOne(Client::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'valide_par_user_id');
    }

    // Méthodes utiles pour l'authentification
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isActive(): bool
    {
        return $this->statut === 'actif';
    }
}