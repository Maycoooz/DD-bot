"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on app start using a secure approach
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Instead of localStorage, check session validity with the backend
        const response = await fetch('/api/auth/verify/', {
          method: 'GET',
          credentials: 'include', // This includes cookies in the request
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Error verifying authentication:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const login = async (credentials) => {
    setIsLoading(true)
    try {
      // Real API call to backend
      const response = await fetch('/api/login/', {
        method: 'POST',
        credentials: 'include', // This includes cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      if (data.success) {
        // The backend should set HTTP-only cookies for authentication
        // We only store non-sensitive user data in the state
        const userData = {
          role: data.usertype,
          username: credentials.username,
          id: data.username,
        }
        setUser(userData)
        
        // Determine redirect path based on user role
        let redirectPath = '/login'
        switch (data.usertype) {
          case "admin":
            redirectPath = "/admin"
            break
          case "parent":
            redirectPath = "/parent-dashboard"
            break
          case "kid":
            redirectPath = "/chat"
            break
          case "librarian":
            redirectPath = "/librarian-dashboard"
            break
        }
        
        return { success: true, redirect: redirectPath }
      } else {
        throw new Error(data.message || "Invalid credentials")
      }
    } catch (error) {
      throw new Error("Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call backend to invalidate the session and clear HTTP-only cookies
      await fetch('/api/logout/', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Clear user state
      setUser(null)
    }
  }

  const isAuthenticated = () => {
    return !!user
  }

  const hasRole = (role) => {
    return user?.role === role
  }

  const getRedirectPath = () => {
    if (!user) return "/login"

    switch (user.role) {
      case "admin":
        return "/admin"
      case "parent":
        return "/parent-dashboard"
      case "kid":
        return "/chat"
      case "librarian":
        return "/librarian-dashboard"
      default:
        return "/login"
    }
  }

const signup = async (userData) => {
  setIsLoading(true)
  try {
    const response = await fetch('/api/signup/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || 'Name',
        email: userData.email || 'user@example.com',
        usertype: userData.usertype
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || 'Signup failed',
      }
    }

    // If backend sends back the user data after signup
    if (data.success && data.user) {
      setUser({
        role: data.user.usertype,
        username: data.user.username,
        id: data.user.user_id,
      })
    }

    return { success: data.success, message: data.message || "Account existed please try another username!" }
  } catch (error) {
    return { success: false, message: error.message || "Signup failed" }
  } finally {
    setIsLoading(false)
  }
}


  const value = {
    user,
    isLoading,
    login,
    logout,
    signup,
    isAuthenticated,
    hasRole,
    getRedirectPath,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
