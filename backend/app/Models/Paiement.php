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
 * Class Paiement
 * 
 * @property int $id
 * @property int $commande_id
 * @property int $client_id
 * @property float $montant
 * @property string $reference_paiement
 * @property string $methode_paiement
 * @property string $statut
 * @property string|null $transaction_id
 * @property string|null $numero_telephone
 * @property string|null $donnees_api
 * @property string|null $message_retour
 * @property Carbon|null $date_initiation
 * @property Carbon|null $date_validation
 * @property Carbon|null $date_echeance
 * @property bool $est_acompte
 * @property float $montant_restant
 * @property int|null $paiement_parent_id
 * @property string|null $notes_admin
 * @property string|null $commentaire_client
 * @property string|null $code_autorisation
 * @property float $montant_rembourse
 * @property Carbon|null $date_remboursement
 * @property string|null $motif_remboursement
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $deleted_at
 * 
 * @property Commande $commande
 * @property Client $client
 * @property Paiement|null $paiement
 * @property Collection|Paiement[] $paiements
 *
 * @package App\Models
 */
class Paiement extends Model
{
	use SoftDeletes;
	protected $table = 'paiements';

	protected $casts = [
		'commande_id' => 'int',
		'client_id' => 'int',
		'montant' => 'float',
		'date_initiation' => 'datetime',
		'date_validation' => 'datetime',
		'date_echeance' => 'datetime',
		'est_acompte' => 'bool',
		'montant_restant' => 'float',
		'paiement_parent_id' => 'int',
		'montant_rembourse' => 'float',
		'date_remboursement' => 'datetime'
	];

	protected $fillable = [
		'commande_id',
		'client_id',
		'montant',
		'reference_paiement',
		'idempotency_key',
		'methode_paiement',
		'statut',
		'transaction_id',
		'numero_telephone',
		'donnees_api',
		'message_retour',
		'date_initiation',
		'date_validation',
		'date_echeance',
		'est_acompte',
		'montant_restant',
		'paiement_parent_id',
		'notes_admin',
		'commentaire_client',
		'code_autorisation',
		'montant_rembourse',
		'date_remboursement',
		'motif_remboursement'
	];

	public function commande()
	{
		return $this->belongsTo(Commande::class);
	}

	public function client()
	{
		return $this->belongsTo(Client::class);
	}

	public function paiement()
	{
		return $this->belongsTo(Paiement::class, 'paiement_parent_id');
	}

	public function paiements()
	{
		return $this->hasMany(Paiement::class, 'paiement_parent_id');
	}
}
