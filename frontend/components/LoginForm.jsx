'use client'
import { useState } from 'react'
import { useAuth } from '../app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Stepper component showing the user flow
function Stepper() {
    const steps = [
        { label: 'Sign in', icon: '1' },
        { label: 'Search zone', icon: '2' },
        { label: 'Get directions', icon: '3' },
    ]

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => (
                <div key={step.label} className="flex items-center">
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                index === 0
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400'
                            }`}
                        >
                            {step.icon}
                        </span>
                        <span className={`text-sm ${index === 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="w-8 h-px bg-gray-700 mx-2" />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function LoginForm({ showHero = false }) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const router = useRouter()

    const { login, register } = useAuth()

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
                setSuccess(isLogin ? 'Login successful!' : 'Registration successful!')
                router.push('/dashboard')
            } else {
                // Ensure error is always a string
                const errorMessage = typeof result.error === 'string' ? result.error : 'An error occurred'
                setError(errorMessage)
            }
        } catch (error) {
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

    return (
        <div className="max-w-md mx-auto">
            {/* Hero section (optional) */}
            {showHero && (
                <div className="text-center mb-8">
                    <p className="text-sm uppercase tracking-widest mb-3" style={{color: 'var(--ucd-muted)'}}>revAMP</p>
                    <h1 className="text-3xl font-bold mb-3" style={{color: 'var(--ucd-light)'}}>
                        Find and pay for parking at UC Davis
                    </h1>
                    <p className="text-base mb-6" style={{color: 'var(--ucd-muted)'}}>
                        Map your options, manage sessions, and keep your parking organized.
                    </p>
                </div>
            )}

            {/* Stepper */}
            <Stepper />

            <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-700">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? 'Sign in to your parking account' : 'Join revAMP for better parking'}
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded text-green-400">
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name Field (only for registration) */}
                    {!isLogin && (
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your full name"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isLogin ? 'Signing In...' : 'Creating Account...'}
                            </span>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                    <button
                        onClick={toggleMode}
                        className="text-blue-400 hover:text-blue-300 text-sm transition duration-200"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>

                {/* Divider */}
                <div className="mt-6 flex items-center">
                    <div className="flex-1 border-t border-gray-700"></div>
                    <span className="px-3 text-gray-500 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-700"></div>
                </div>

                {/* Continue as Guest */}
                <div className="mt-6 text-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition duration-200"
                    >
                        Continue as Guest
                    </Link>
                    <p className="mt-2 text-xs text-gray-500">
                        Browse parking zones without an account
                    </p>
                </div>

                {/* Demo Account Info */}
                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-xs mb-1">Demo account for testing:</p>
                    <p className="text-gray-600 text-xs font-mono">
                        demo@example.com / demo123
                    </p>
                </div>
            </div>
        </div>
    )
}
