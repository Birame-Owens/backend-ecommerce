<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Client
 * 
 * @property int $id
 * @property string $nom
 * @property string $prenom
 * @property string $telephone
 * @property string|null $email
 * @property string|null $genre
 * @property Carbon|null $date_naissance
 * @property string|null $adresse_principale
 * @property string|null $quartier
 * @property string $ville
 * @property string|null $indications_livraison
 * @property string|null $taille_habituelle
 * @property string|null $couleurs_preferees
 * @property string|null $styles_preferes
 * @property float|null $budget_moyen
 * @property int $nombre_commandes
 * @property float $total_depense
 * @property float $panier_moyen
 * @property Carbon|null $derniere_commande
 * @property Carbon|null $derniere_visite
 * @property string $type_client
 * @property int $score_fidelite
 * @property bool $accepte_whatsapp
 * @property bool $accepte_email
 * @property bool $accepte_sms
 * @property bool $accepte_promotions
 * @property string|null $canaux_preferes
 * @property int|null $user_id
 * @property string|null $notes_privees
 * @property string $priorite
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property User|null $user
 * @property Collection|Commande[] $commandes
 * @property Collection|Panier[] $paniers
 * @property Collection|Paiement[] $paiements
 * @property Collection|Facture[] $factures
 * @property Collection|MessagesWhatsapp[] $messages_whatsapps
 * @property Collection|AvisClient[] $avis_clients
 *
 * @package App\Models
 */
class Client extends Model
{
	use SoftDeletes;
	protected $table = 'clients';

	protected $casts = [
		'date_naissance' => 'datetime',
		'budget_moyen' => 'float',
		'nombre_commandes' => 'int',
		'total_depense' => 'float',
		'panier_moyen' => 'float',
		'derniere_commande' => 'datetime',
		'derniere_visite' => 'datetime',
		'score_fidelite' => 'int',
		'accepte_whatsapp' => 'bool',
		'accepte_email' => 'bool',
		'accepte_sms' => 'bool',
		'accepte_promotions' => 'bool',
		'user_id' => 'int'
	];

	protected $fillable = [
		'nom',
		'prenom',
		'telephone',
		'email',
		'genre',
		'date_naissance',
		'adresse_principale',
		'quartier',
		'ville',
		'indications_livraison',
		'taille_habituelle',
		'couleurs_preferees',
		'styles_preferes',
		'budget_moyen',
		'nombre_commandes',
		'total_depense',
		'panier_moyen',
		'derniere_commande',
		'derniere_visite',
		'type_client',
		'score_fidelite',
		'accepte_whatsapp',
		'accepte_email',
		'accepte_sms',
		'accepte_promotions',
		'canaux_preferes',
		'user_id',
		'notes_privees',
		'priorite'
	];

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function commandes()
	{
		return $this->hasMany(Commande::class);
	}

	public function paniers()
	{
		return $this->hasMany(Panier::class);
	}

	public function paiements()
	{
		return $this->hasMany(Paiement::class);
	}

	public function factures()
	{
		return $this->hasMany(Facture::class);
	}

	public function messages_whatsapps()
	{
		return $this->hasMany(MessagesWhatsapp::class);
	}

	public function avis_clients()
	{
		return $this->hasMany(AvisClient::class);
	}
	// Dans App\Models\Client.php

public function mesures()
{
    return $this->hasOne(MesureClient::class);
}
}
