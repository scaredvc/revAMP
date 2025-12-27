'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const AuthContext = createContext()
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Helper to guarantee JSON payloads (prevents browsers from defaulting to text/plain)
const postJson = async (path, payload, init = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        ...init,
        headers: {
            ...(init.headers || {}),
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload ?? {}),
    })

    const data = await response.json().catch(() => ({}))
    return { response, data }
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
            const apiUrl = `${API_BASE}/auth/me`
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                return await response.json()
            }
            
            // If unauthorized, token might be invalid - return null to clear it
            if (response.status === 401 || response.status === 403) {
                return null
            }
            
            return null
        } catch (error) {
            // Network error - backend might not be running
            console.error('Error fetching user info:', error.message)
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                console.warn('Cannot connect to backend API. Make sure the backend server is running on port 8000.')
            }
            return null
        }
    }

    const login = async (email, password) => {
        try {
            const { response, data } = await postJson('/auth/login', { email, password })

            if (response.ok) {
                localStorage.setItem('parkingToken', data.access_token)
                
                setToken(data.access_token)
                
                // Fetch user info after successful login
                const userInfo = await fetchUserInfo(data.access_token)
                if (userInfo) {
                    setUser(userInfo)
                }
                
                return { success: true }
            } else {
                let errorMessage = 'Login failed'
                if (data.detail) {
                    if (typeof data.detail === 'string') {
                        errorMessage = data.detail
                    } else if (Array.isArray(data.detail)) {
                        errorMessage = data.detail.map(err => err.msg || 'Validation error').join(', ')
                    } else if (typeof data.detail === 'object') {
                        errorMessage = data.detail.msg || 'Validation error'
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
            const { response, data } = await postJson('/auth/register', { 
                email, 
                username: email, // Use email as username for now
                password, 
                full_name: fullName 
            })

            if (response.ok) {
                // For registration, the response is the user object, not a token
                // We need to login after registration to get the token
                const loginResponse = await postJson('/auth/login', { email, password })
                
                if (loginResponse.response.ok) {
                    localStorage.setItem('parkingToken', loginResponse.data.access_token)
                    setToken(loginResponse.data.access_token)
                    setUser(data) // Use the user data from registration
                    return { success: true }
                } else {
                    const loginError = loginResponse.data?.detail
                    return { success: false, error: typeof loginError === 'string' ? loginError : 'Registration successful but login failed' }
                }
            } else {
                let errorMessage = 'Registration failed'
                if (data.detail) {
                    if (typeof data.detail === 'string') {
                        errorMessage = data.detail
                    } else if (Array.isArray(data.detail)) {
                        errorMessage = data.detail.map(err => err.msg || 'Validation error').join(', ')
                    } else if (typeof data.detail === 'object') {
                        errorMessage = data.detail.msg || 'Validation error'
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
