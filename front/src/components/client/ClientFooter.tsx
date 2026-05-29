import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ClientFooter() {
  return (
    <footer className="hidden md:block bg-ink text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white/20">
                <img src="/logo rokia.jpg" alt="Rokia Shop" className="w-full h-full object-cover" />
              </div>
              <div className="leading-none">
                <span className="font-serif font-bold text-lg block">Rokia</span>
                <span className="text-beige-400 text-[11px] font-bold tracking-widest uppercase">Shop</span>
              </div>
            </Link>
            <p className="text-sm text-white/65 leading-relaxed mt-4">
              Mode africaine moderne, pieces premium et livraison rapide au Senegal.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4">Boutique</h3>
            <div className="space-y-2 text-sm text-white/65">
              <Link className="block hover:text-beige-400" to="/categories">Categories</Link>
              <Link className="block hover:text-beige-400" to="/produits">Produits</Link>
              <Link className="block hover:text-beige-400" to="/promotions">Promotions</Link>
              <Link className="block hover:text-beige-400" to="/favoris">Favoris</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4">Service</h3>
            <div className="space-y-2 text-sm text-white/65">
              <Link className="block hover:text-beige-400" to="/panier">Panier</Link>
              <Link className="block hover:text-beige-400" to="/profil">Mon compte</Link>
              <Link className="block hover:text-beige-400" to="/a-propos">A propos</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-4">Contact</h3>
            <div className="space-y-3 text-sm text-white/65">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-beige-400" /> Dakar, Senegal</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-beige-400" /> +221 78 466 14 12</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-beige-400" /> contact@ndeyashop.sn</p>
              <div className="flex items-center gap-2 pt-1">
                <a href="https://wa.me/221784661412" className="p-2 rounded-xl bg-white/10 hover:bg-beige-500" aria-label="WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href="https://instagram.com/ndeyashop" className="p-2 rounded-xl bg-white/10 hover:bg-beige-500" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-5 text-xs text-white/45 flex items-center justify-between">
          <span>© 2026 Rokia Shop. Tous droits reserves.</span>
          <span>NDEYA SHOP</span>
        </div>
      </div>
    </footer>
  )
}
