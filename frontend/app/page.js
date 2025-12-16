'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './contexts/AuthContext'

export default function Home() {
    const { isAuthenticated, isLoading, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/dashboard')
        }
    }, [isLoading, isAuthenticated, router])

    return (
        <main className="container mx-auto p-8 min-h-screen flex items-center justify-center" style={{background: 'var(--ucd-darker)'}}>
            <div className="max-w-3xl text-center space-y-6">
                <p className="text-sm uppercase tracking-widest" style={{color: 'var(--ucd-muted)'}}>revAMP</p>
                <h1 className="text-4xl font-bold" style={{color: 'var(--ucd-light)'}}>Find and pay for parking at UC Davis</h1>
                <p className="text-lg" style={{color: 'var(--ucd-muted)'}}>
                    Map your options, manage sessions, and keep your parking organized. Sign in to jump into your dashboard.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/login"
                        className="px-8 py-3 rounded-lg text-lg font-semibold transition duration-200"
                        style={{background: 'var(--ucd-primary)', color: 'var(--ucd-light)'}}
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
                    </Link>
                    {!isAuthenticated && (
                        <span className="text-sm" style={{color: 'var(--ucd-muted)'}}>
                            No account? Register on the sign-in page.
                        </span>
                    )}
                </div>
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-sm" style={{color: 'var(--ucd-muted)'}}>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>
                        Checking session…
                    </div>
                )}
                {isAuthenticated && (
                    <p className="text-sm" style={{color: 'var(--ucd-muted)'}}>
                        Welcome back{user?.full_name ? `, ${user.full_name}` : ''}! Redirecting to your dashboard.
                    </p>
                )}
            </div>
        </main>
    )
}
