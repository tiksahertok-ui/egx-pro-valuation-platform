'use client'

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Triangle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      try {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        })

        if (result?.error) {
          setError('Invalid email or password / بريد إلكتروني أو كلمة مرور غير صحيحة')
        } else {
          router.push('/')
          router.refresh()
        }
      } catch {
        setError('An unexpected error occurred / حدث خطأ غير متوقع')
      } finally {
        setLoading(false)
      }
    },
    [email, password, router]
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#0a0e17' }}
    >
      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
      />

      <Card
        className="relative z-10 w-full max-w-md border shadow-2xl shadow-cyan-950/20"
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <CardHeader className="text-center space-y-3 pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Triangle className="size-12 text-cyan-400 fill-cyan-400/20" strokeWidth={1.5} />
              <div className="absolute inset-0 blur-xl bg-cyan-400/20 rounded-full" />
            </div>
          </div>

          <CardTitle
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#e2e8f0' }}
          >
            EGX Pro
          </CardTitle>
          <CardDescription
            className="text-sm"
            style={{ color: '#94a3b8' }}
          >
            Egyptian Stock Valuation Platform
            <br />
            <span className="text-xs" style={{ color: '#64748b' }}>
              منصة تقييم الأسهم المصرية
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm flex items-start gap-2"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                <ShieldCheck className="size-4 mt-0.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
                style={{ color: '#cbd5e1' }}
              >
                <span>Email</span>
                <span className="text-xs mr-1" style={{ color: '#64748b' }}>
                  البريد الإلكتروني
                </span>
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@egxpro.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-base"
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  color: '#e2e8f0',
                }}
                disabled={loading}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: '#cbd5e1' }}
              >
                <span>Password</span>
                <span className="text-xs mr-1" style={{ color: '#64748b' }}>
                  كلمة المرور
                </span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-base pr-11"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    color: '#e2e8f0',
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 text-base font-semibold transition-all cursor-pointer"
              style={{
                backgroundColor: loading ? '#0e7490' : '#06b6d4',
                color: '#0a0e17',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in... / جاري تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Sign In / تسجيل الدخول
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid #1e293b' }}>
            <p className="text-xs" style={{ color: '#475569' }}>
              Institutional-grade analytics for the Egyptian Exchange
              <br />
              تحليلات مؤسسية للبورصة المصرية
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
