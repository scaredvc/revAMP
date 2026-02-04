'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '../../components/LoginForm'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/dashboard')
        }
    }, [isLoading, isAuthenticated, router])

    return (
        <main className="min-h-screen bg-midnight relative overflow-hidden">
            {/* Background decoration */}
            <div className="gradient-orb gold" style={{ width: 800, height: 800, top: -300, right: -200, opacity: 0.6 }} />
            <div className="gradient-orb aggie" style={{ width: 600, height: 600, bottom: -200, left: -100, opacity: 0.4 }} />
            <div className="gradient-orb sage" style={{ width: 400, height: 400, top: '40%', left: '60%', opacity: 0.2 }} />

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
                aria-hidden="true"
            />

            <div className="relative z-10 min-h-screen flex">
                {/* Left panel - Hero */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative">
                    {/* Logo */}
                    <div className="animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-lg shadow-gold/20">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="font-mono text-sm tracking-[0.2em] uppercase text-gold/80">revAMP</span>
                        </div>
                    </div>

                    {/* Main headline */}
                    <div className="max-w-lg">
                        <div className="animate-fade-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                            <p className="font-mono text-xs tracking-[0.3em] uppercase text-gold/50 mb-6">
                                UC Davis Parking
                            </p>
                        </div>
                        <h1
                            className="font-display text-6xl font-bold leading-[1.05] tracking-tight mb-8 animate-fade-up"
                            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
                        >
                            <span className="text-gradient-gold">Navigate</span>
                            <br />
                            <span className="text-white/90">campus parking</span>
                            <br />
                            <span className="text-white/50 italic">with clarity.</span>
                        </h1>
                        <p
                            className="text-lg text-white/40 leading-relaxed max-w-md animate-fade-up"
                            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
                        >
                            Real-time zone mapping, smart search, and directions -
                            all in one place. No more circling lots.
                        </p>
                    </div>

                    {/* Bottom stats */}
                    <div
                        className="flex gap-12 animate-fade-up"
                        style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
                    >
                        <div>
                            <div className="font-display text-3xl font-bold text-gradient-gold">50+</div>
                            <div className="text-xs text-white/30 mt-1 font-mono uppercase tracking-wider">Parking Zones</div>
                        </div>
                        <div>
                            <div className="font-display text-3xl font-bold text-gradient-sage">Live</div>
                            <div className="text-xs text-white/30 mt-1 font-mono uppercase tracking-wider">Map Data</div>
                        </div>
                        <div>
                            <div className="font-display text-3xl font-bold text-white/80">Free</div>
                            <div className="text-xs text-white/30 mt-1 font-mono uppercase tracking-wider">For Students</div>
                        </div>
                    </div>
                </div>

                {/* Right panel - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-3 mb-12 animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="font-mono text-sm tracking-[0.2em] uppercase text-gold/80">revAMP</span>
                        </div>
                        <LoginForm />
                    </div>
                </div>
            </div>
        </main>
    )
}
