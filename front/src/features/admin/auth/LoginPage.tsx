import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { adminAuthApi } from '@/api/admin/auth'
import { useAdminAuthStore } from '@/store/adminAuthStore'
import type { ApiError } from '@/types/admin'
import { AxiosError } from 'axios'

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAdminAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await adminAuthApi.login(data)
      const payload = res.data.data ?? res.data
      setAuth(payload.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      if (axiosErr.response?.status === 422 && axiosErr.response.data?.errors) {
        const firstError = Object.values(axiosErr.response.data.errors)[0]?.[0]
        setServerError(firstError ?? 'Identifiants invalides.')
      } else {
        setServerError(axiosErr.response?.data?.message ?? 'Une erreur est survenue.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">

      {/* Motif de fond subtil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #78716c 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-900 mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl tracking-tight">N</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">NDEYA SHOP</h1>
          <p className="mt-1 text-sm text-stone-500">Espace d'administration</p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">

          <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-widest mb-6">
            Connexion
          </h2>

          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@ndeya.com"
                {...register('email')}
                className={`
                  w-full px-3.5 py-2.5 rounded-lg text-sm text-stone-900 placeholder-stone-300
                  bg-stone-50 border outline-none transition-all
                  focus:ring-2 focus:ring-stone-800 focus:border-stone-800 focus:bg-white
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-stone-200 hover:border-stone-300'}
                `}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`
                    w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-stone-900 placeholder-stone-300
                    bg-stone-50 border outline-none transition-all
                    focus:ring-2 focus:ring-stone-800 focus:border-stone-800 focus:bg-white
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-stone-200 hover:border-stone-300'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex items-center justify-center gap-2 mt-2
                px-4 py-2.5 rounded-lg
                text-xs font-semibold uppercase tracking-widest
                bg-stone-900 hover:bg-stone-800 text-white
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2
              "
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                : 'Se connecter'
              }
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-stone-400">
          Ndeya Shop © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
