'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './contexts/AuthContext'

export default function Home() {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            router.replace(isAuthenticated ? '/dashboard' : '/login')
        }
    }, [isLoading, isAuthenticated, router])

    return (
        <main className="min-h-screen flex items-center justify-center bg-midnight relative overflow-hidden">
            {/* Background orbs */}
            <div className="gradient-orb gold" style={{ width: 500, height: 500, top: -100, right: -100 }} />
            <div className="gradient-orb aggie" style={{ width: 600, height: 600, bottom: -200, left: -200 }} />

            <div className="flex flex-col items-center gap-6 relative z-10">
                <div className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                <p className="text-sm font-mono text-gold/60 tracking-widest uppercase">
                    Loading
                </p>
            </div>
        </main>
    )
}
