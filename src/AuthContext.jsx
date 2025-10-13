"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()
const API_BASE = import.meta.env.VITE_API_URL

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

  // ------------------ Check authentication status on app start ------------------
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/verify/`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok) {
          const userData = await response.json()
          setUser({
            user_id: userData.id,
            username: userData.username,
            role: userData.role,
          })
        }
      } catch (error) {
        console.error("Error verifying authentication:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // ------------------ Login ------------------
  const login = async (credentials) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()

      if (data.success) {
        setUser({
          user_id: data.user_id,
          username: data.username,
          role: data.usertype,
        })

        let redirectPath = "/login"
        switch (data.usertype) {
          case "admin":
            redirectPath = "/admin-dashboard"
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

  // ------------------ Logout ------------------
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setUser(null)
    }
  }

  // ------------------ Signup ------------------
const signup = async (userData) => {
  setIsLoading(true)
  try {
    // Select endpoint based on user type
    let endpoint = "/auth/register"
    if (userData.usertype === "librarian") {
      endpoint = "/auth/register-librarian"
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password,
        first_name: userData.first_name || "User",
        last_name: userData.last_name || "Name",
        email: userData.email || "user@example.com",
        country: userData.country || null,
        gender: userData.gender || null,
        birthday: userData.birthday || null,
        race: userData.race || null,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || "Signup failed",
      }
    }

    // Success
    return { success: true, message: data.message || "Signup successful" }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, message: error.message || "Signup failed" }
  } finally {
    setIsLoading(false)
  }
}
  // ------------------ Helpers ------------------
  const isAuthenticated = () => !!user
  const hasRole = (role) => user?.role === role

  const getRedirectPath = () => {
    if (!user) return "/login"

    switch (user.role) {
      case "admin":
        return "/admin-dashboard"
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
