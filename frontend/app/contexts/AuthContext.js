'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [token, setToken] = useState(null)

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const savedToken = localStorage.getItem('parkingToken')
            
            if (savedToken) {
                const userInfo = await fetchUserInfo(savedToken)
                if (userInfo) {
                    setUser(userInfo)
                    setToken(savedToken)
                } else {
                    localStorage.removeItem('parkingToken')
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error)
            localStorage.removeItem('parkingToken')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUserInfo = async (authToken) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                return await response.json()
            }
            return null
        } catch (error) {
            console.error('Error fetching user info:', error)
            return null
        }
    }

    const login = async (email, password) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email, password })
            })

            if (response.ok) {
                const data = await response.json()
                
                localStorage.setItem('parkingToken', data.access_token)
                
                setToken(data.access_token)
                
                // Fetch user info after successful login
                const userInfo = await fetchUserInfo(data.access_token)
                if (userInfo) {
                    setUser(userInfo)
                }
                
                return { success: true }
            } else {
                const errorData = await response.json()
                // Handle different error formats from backend
                let errorMessage = 'Login failed'
                if (errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail
                    } else if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(err => err.msg || 'Validation error').join(', ')
                    } else if (typeof errorData.detail === 'object') {
                        errorMessage = errorData.detail.msg || 'Validation error'
                    }
                }
                return { success: false, error: errorMessage }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Network error. Please try again.' }
        }
    }

    const register = async (email, password, fullName) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    username: email, // Use email as username for now
                    password, 
                    full_name: fullName 
                })
            })

            if (response.ok) {
                const data = await response.json()
                
                // For registration, the response is the user object, not a token
                // We need to login after registration to get the token
                const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, password })
                })
                
                if (loginResponse.ok) {
                    const loginData = await loginResponse.json()
                    localStorage.setItem('parkingToken', loginData.access_token)
                    setToken(loginData.access_token)
                    setUser(data) // Use the user data from registration
                    return { success: true }
                } else {
                    return { success: false, error: 'Registration successful but login failed' }
                }
            } else {
                const errorData = await response.json()
                // Handle different error formats from backend
                let errorMessage = 'Registration failed'
                if (errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail
                    } else if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(err => err.msg || 'Validation error').join(', ')
                    } else if (typeof errorData.detail === 'object') {
                        errorMessage = errorData.detail.msg || 'Validation error'
                    }
                }
                return { success: false, error: errorMessage }
            }
        } catch (error) {
            console.error('Registration error:', error)
            return { success: false, error: 'Network error. Please try again.' }
        }
    }

    const logout = () => {
        localStorage.removeItem('parkingToken')
        
        setToken(null)
        setUser(null)
    }

    const value = {
        user,           // Current user data
        token,          // JWT token
        isLoading,      // Loading state
        login,          // Login function
        register,       // Register function
        logout,         // Logout function
        isAuthenticated: !!user  // Boolean: true if user is logged in
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
