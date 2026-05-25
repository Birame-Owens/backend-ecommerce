import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await adminAuthApi.login(data)
      setAuth(res.data.token, res.data.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message
      if (axiosErr.response?.status === 422 && axiosErr.response.data?.errors) {
        const firstError = Object.values(axiosErr.response.data.errors)[0]?.[0]
        setServerError(firstError ?? 'Identifiants invalides.')
      } else {
        setServerError(msg ?? 'Une erreur est survenue. Veuillez réessayer.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Ndeya Shop
          </h1>
          <p className="mt-1 text-sm text-gray-400">Espace d'administration</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-medium text-white mb-6">Connexion</h2>

          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@ndeya.com"
                {...register('email')}
                className={`
                  w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-gray-600
                  bg-gray-800 border transition-colors outline-none
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                  ${errors.email ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}
                `}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
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
                    w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-gray-600
                    bg-gray-800 border transition-colors outline-none
                    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    ${errors.password ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2.5 rounded-lg text-sm font-medium
                bg-brand-600 hover:bg-brand-500 text-white
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-900
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-gray-600">
          Ndeya Shop © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
