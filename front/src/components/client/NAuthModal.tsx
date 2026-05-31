import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { NIcon } from './NIcon'
import { useClientAuthStore } from '@/store/clientAuthStore'
import { useToastStore } from '@/store/toastStore'

type Tab = 'login' | 'register'

interface LoginForm { email: string; password: string }
interface RegisterForm {
  prenom: string; nom: string
  email: string; telephone: string
  password: string; password_confirmation: string
  accepte_conditions: boolean
}

function inputCls(err?: boolean) {
  return `w-full h-11 px-4 rounded-[10px] border text-[13.5px] bg-white focus:outline-none transition-colors
    ${err ? 'border-red-300 focus:border-red-400' : 'border-line focus:border-accent'}`
}

function FieldErr({ id, msg }: { id?: string; msg?: string }) {
  if (!msg) return null
  return <p id={id} role="alert" className="text-[11px] text-red-500 mt-1">{msg}</p>
}

function PasswordInput({ id, name, label, placeholder, register, error }: {
  id: string
  name: string
  label: string
  placeholder: string
  register: ReturnType<typeof useForm>['register']
  error?: string
}) {
  const [show, setShow] = useState(false)
  const errId = `${id}-err`
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...register(name)}
          className={`${inputCls(!!error)} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
        >
          <NIcon name={show ? 'close' : 'lock'} size={15} strokeWidth={1.8} />
        </button>
      </div>
      <FieldErr id={errId} msg={error} />
    </div>
  )
}

/* ─── Login form ─────────────────────────────────────────────────── */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useClientAuthStore()
  const toast = useToastStore((s) => s.show)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  async function onSubmit(data: LoginForm) {
    setLoading(true); setError('')
    try {
      await login(data.email, data.password)
      toast('Connexion réussie', 'check')
      onSuccess()
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-[12.5px] text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="email@exemple.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'login-email-err' : undefined}
          {...register('email', { required: 'Requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })}
          className={inputCls(!!errors.email)}
        />
        <FieldErr id="login-email-err" msg={errors.email?.message} />
      </div>

      <PasswordInput
        id="login-password"
        name="password"
        label="Mot de passe"
        placeholder="••••••••"
        register={register}
        error={errors.password?.message}
      />

      <button type="submit" disabled={loading}
        className="w-full h-12 rounded-[10px] bg-accent text-white text-[13px] font-bold
          hover:bg-accent-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />Connexion...</>
          : 'Se connecter'}
      </button>
    </form>
  )
}

/* ─── Register form ──────────────────────────────────────────────── */
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register: registerUser } = useClientAuthStore()
  const toast = useToastStore((s) => s.show)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const pw = watch('password')

  async function onSubmit(data: RegisterForm) {
    setLoading(true); setError('')
    try {
      await registerUser({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        accepte_conditions: data.accepte_conditions,
      })
      toast('Inscription réussie ! Bienvenue 🎉', 'check')
      onSuccess()
    } catch (e: unknown) {
      setError((e as Error).message ?? "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {error && (
        <div role="alert" className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-[12.5px] text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="reg-prenom" className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Prénom</label>
          <input
            id="reg-prenom"
            placeholder="Amadou"
            autoComplete="given-name"
            aria-invalid={!!errors.prenom}
            aria-describedby={errors.prenom ? 'reg-prenom-err' : undefined}
            {...register('prenom', { required: 'Requis' })}
            className={inputCls(!!errors.prenom)}
          />
          <FieldErr id="reg-prenom-err" msg={errors.prenom?.message} />
        </div>
        <div className="space-y-1">
          <label htmlFor="reg-nom" className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Nom</label>
          <input
            id="reg-nom"
            placeholder="DIOP"
            autoComplete="family-name"
            aria-invalid={!!errors.nom}
            aria-describedby={errors.nom ? 'reg-nom-err' : undefined}
            {...register('nom', { required: 'Requis' })}
            className={inputCls(!!errors.nom)}
          />
          <FieldErr id="reg-nom-err" msg={errors.nom?.message} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Email</label>
        <input
          id="reg-email"
          type="email"
          placeholder="email@exemple.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'reg-email-err' : undefined}
          {...register('email', { required: 'Requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })}
          className={inputCls(!!errors.email)}
        />
        <FieldErr id="reg-email-err" msg={errors.email?.message} />
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-tel" className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Téléphone</label>
        <input
          id="reg-tel"
          type="tel"
          placeholder="77 000 00 00"
          autoComplete="tel"
          aria-invalid={!!errors.telephone}
          aria-describedby={errors.telephone ? 'reg-tel-err' : undefined}
          {...register('telephone', { required: 'Requis', pattern: { value: /^[0-9+\s]{9,15}$/, message: 'Numéro invalide (ex: 77 000 00 00)' } })}
          className={inputCls(!!errors.telephone)}
        />
        <FieldErr id="reg-tel-err" msg={errors.telephone?.message} />
      </div>

      <PasswordInput
        id="reg-password"
        name="password"
        label="Mot de passe"
        placeholder="8 caractères minimum"
        register={register}
        error={errors.password?.message}
      />

      <PasswordInput
        id="reg-password_confirmation"
        name="password_confirmation"
        label="Confirmer le mot de passe"
        placeholder="Répéter le mot de passe"
        register={register}
        error={errors.password_confirmation?.message}
      />

      <div>
        <label className="flex items-start gap-3 pt-1 cursor-pointer">
          <input
            id="reg-conditions"
            type="checkbox"
            aria-describedby={errors.accepte_conditions ? 'reg-conditions-err' : undefined}
            {...register('accepte_conditions', { required: 'Vous devez accepter les conditions' })}
            className="mt-0.5 w-4 h-4 accent-accent cursor-pointer"
          />
          <span className="text-[12px] text-ink-2 leading-snug">
            J'accepte les{' '}
            <button
              type="button"
              className="text-accent underline cursor-pointer"
              onClick={() => {/* open CGU modal */}}
            >
              conditions d'utilisation
            </button>
            {' '}et la politique de confidentialité
          </span>
        </label>
        <FieldErr id="reg-conditions-err" msg={errors.accepte_conditions?.message} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full h-12 rounded-[10px] bg-accent text-white text-[13px] font-bold
          hover:bg-accent-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />Inscription...</>
          : 'Créer mon compte'}
      </button>
    </form>
  )
}

/* ─── Modal wrapper ──────────────────────────────────────────────── */
export function NAuthModal({
  isOpen, onClose, initialTab = 'login',
}: {
  isOpen: boolean
  onClose: () => void
  initialTab?: Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = 'auth-modal-title'

  /* Sync tab when prop changes */
  useEffect(() => { if (isOpen) setTab(initialTab) }, [isOpen, initialTab])

  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  /* Focus trap */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [isOpen, tab])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-[20px] shadow-2xl
          max-h-[92dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-bold tracking-[.22em] uppercase text-accent" aria-hidden="true">ND WORLD</p>
              <h2 id={titleId} className="font-serif font-bold text-[20px] text-ink leading-tight">
                {tab === 'login' ? 'Se connecter' : 'Créer un compte'}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 grid place-items-center rounded-full bg-paper hover:bg-sand transition-colors"
            >
              <NIcon name="close" size={18} strokeWidth={2} className="text-ink" />
            </button>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Mode d'authentification" className="flex rounded-[10px] bg-paper p-1 gap-1">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 h-9 rounded-[8px] text-[12px] font-semibold transition-all
                  ${tab === t ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'}`}
              >
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {tab === 'login'
            ? <LoginForm onSuccess={onClose} />
            : <RegisterForm onSuccess={onClose} />}

          <p className="text-center text-[12px] text-muted mt-4">
            {tab === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
              className="text-accent font-semibold hover:underline"
            >
              {tab === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
