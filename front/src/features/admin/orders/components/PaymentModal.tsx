import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { AdminOrderDetail } from '@/types/admin'
import { fmtMoney, paymentMethods } from '../orderHelpers'

interface Props {
  order: AdminOrderDetail
  onClose: () => void
  onSubmit: (payload: { montant: number; methode_paiement: string; reference_paiement?: string | null }) => void
  loading: boolean
}

export function PaymentModal({ order, onClose, onSubmit, loading }: Props) {
  const [montant, setMontant] = useState(order.montant_restant || order.montant_total)
  const [methode, setMethode] = useState(paymentMethods[0].value)
  const [reference, setReference] = useState('')

  useEffect(() => {
    setMontant(order.montant_restant || order.montant_total)
  }, [order.montant_restant, order.montant_total])

  return (
    <div className="fixed inset-0 z-[130] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-beige-50 w-full max-w-md rounded-2xl border border-beige-300 shadow-beige-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">Enregistrer un paiement</h3>
          <button onClick={onClose} className="p-2 rounded-xl border border-beige-300 hover:bg-beige-200">
            <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Montant</label>
            <input
              type="number"
              min={0}
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
            />
            <p className="text-[11px] text-muted mt-1">Reste a payer: {fmtMoney(order.montant_restant)} FCFA</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Methode</label>
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-beige-100 border border-beige-300 text-muted focus:outline-none focus:border-beige-400"
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Reference</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PAY-2026..."
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-beige-100 border border-beige-300 text-ink focus:outline-none focus:ring-2 focus:ring-beige-400/40 focus:border-beige-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-beige-300 text-muted hover:bg-beige-200"
          >
            Annuler
          </button>
          <button
            onClick={() => onSubmit({ montant, methode_paiement: methode, reference_paiement: reference || null })}
            disabled={loading || montant <= 0}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-beige-500 text-white hover:bg-beige-400 disabled:opacity-50"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
