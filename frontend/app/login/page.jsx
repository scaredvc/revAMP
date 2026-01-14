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
        <main className="container mx-auto p-8 min-h-screen flex items-center justify-center" style={{background: 'var(--ucd-darker)'}}>
            <div className="w-full max-w-lg">
                <LoginForm showHero={true} />
            </div>
        </main>
    )
}
