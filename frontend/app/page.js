'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './contexts/AuthContext'

export default function Home() {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            // Single-entry experience: redirect to dashboard if authenticated, login otherwise
            router.replace(isAuthenticated ? '/dashboard' : '/login')
        }
    }, [isLoading, isAuthenticated, router])

    // Show loading state while checking auth
    return (
        <main className="min-h-screen flex items-center justify-center" style={{background: 'var(--ucd-darker)'}}>
            <div className="flex items-center justify-center gap-3 text-sm" style={{color: 'var(--ucd-muted)'}}>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></span>
                Loading...
            </div>
        </main>
    )
}
