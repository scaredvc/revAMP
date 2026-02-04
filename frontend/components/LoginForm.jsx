'use client'
import { useState } from 'react'
import { useAuth } from '../app/contexts/AuthContext'
import { useRouter } from 'next/navigation'

function StepIndicator() {
    const steps = [
        { label: 'Sign in', num: '01' },
        { label: 'Search zone', num: '02' },
        { label: 'Get directions', num: '03' },
    ]

    return (
        <div className="flex items-center gap-3 mb-10">
            {steps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={`font-mono text-xs tracking-wider ${
                                index === 0
                                    ? 'text-gold'
                                    : 'text-white/20'
                            }`}
                        >
                            {step.num}
                        </span>
                        <span className={`text-xs ${
                            index === 0 ? 'text-white/80 font-medium' : 'text-white/20'
                        }`}>
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="w-6 h-px bg-white/10" />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function LoginForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const router = useRouter()
    const { login, register, loginAsGuest } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            let result

            if (isLogin) {
                result = await login(email, password)
            } else {
                result = await register(email, password, fullName)
            }

            if (result.success) {
                setSuccess(isLogin ? 'Welcome back.' : 'Account created.')
                router.push('/dashboard')
            } else {
                const errorMessage = typeof result.error === 'string' ? result.error : 'An error occurred'
                setError(errorMessage)
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleMode = () => {
        setIsLogin(!isLogin)
        setEmail('')
        setPassword('')
        setFullName('')
        setError('')
        setSuccess('')
    }

    const handleGuestAccess = async () => {
        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const result = await loginAsGuest()
            if (result.success) {
                setSuccess('Continuing as guest.')
                router.push('/dashboard')
            } else {
                setError(result.error || 'Guest login failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="animate-fade-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            {/* Step indicator */}
            <StepIndicator />

            {/* Form card */}
            <div className="glass-panel-strong p-8 lg:p-10">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="font-display text-2xl font-bold text-white/95 tracking-tight mb-2">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-sm text-white/40">
                        {isLogin ? 'Sign in to access your parking dashboard' : 'Join revAMP for smarter campus parking'}
                    </p>
                </div>

                {/* Status messages */}
                {success && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-sage/10 border border-sage/20 text-sage text-sm flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-rose/10 border border-rose/20 text-rose text-sm flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name (registration only) */}
                    {!isLogin && (
                        <div className="animate-fade-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
                            <label htmlFor="fullName" className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 text-sm"
                                placeholder="Your name"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 text-sm"
                            placeholder="you@ucdavis.edu"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/90 placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 text-sm"
                            placeholder="Min 7 characters"
                            required
                            minLength={7}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-gold-600 to-gold text-midnight hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-gold/30 focus:ring-offset-2 focus:ring-offset-midnight"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-midnight/30 border-t-midnight animate-spin" />
                                {isLogin ? 'Signing in...' : 'Creating account...'}
                            </span>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                {/* Toggle mode */}
                <div className="mt-6 text-center">
                    <button
                        onClick={toggleMode}
                        className="text-white/30 hover:text-gold text-sm transition-colors duration-300"
                    >
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <span className="text-gold/70 hover:text-gold font-medium">
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </span>
                    </button>
                </div>

                {/* Divider */}
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-white/20 text-xs font-mono uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Guest access */}
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleGuestAccess}
                        disabled={isSubmitting}
                        className="flex items-center justify-center w-full py-3.5 px-6 rounded-xl border border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 text-sm font-medium"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 opacity-50">
                            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                            <polyline points="10,17 15,12 10,7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        Continue as Guest
                    </button>
                    <p className="mt-2 text-center text-[0.65rem] text-white/20 tracking-wider">
                        Browse parking zones without an account
                    </p>
                </div>

                {/* Demo credentials */}
                <div className="mt-6 pt-5 border-t border-white/[0.04] text-center">
                    <p className="text-white/20 text-[0.65rem] tracking-wider uppercase mb-1">Demo Account</p>
                    <p className="text-white/10 text-xs font-mono">
                        demo@example.com / demo123
                    </p>
                </div>
            </div>
        </div>
    )
}
