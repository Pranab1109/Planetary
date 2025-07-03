import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'

const AuthContext = createContext(null);


export const useAuth = () => {
    return useContext(AuthContext);
};

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);


    // Simulate checking login status on initial load (e.g., from localStorage)
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(userData);
            } catch (e) {
                console.error("Failed to parse stored user or token data:", e);
                // Clear corrupted data if parsing fails
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsInitialLoading(false); // Initial loading complete
    }, []);

    // Helper function to handle successful login/signup
    const handleAuthSuccess = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setAuthError(null); // Clear any previous errors
        console.log("User authenticated:", newUser);
    };

    const signIn = async (email, password) => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            console.log("Signing in...")
            const response = await axios.post(`${backendUrl}/auth/login`, { email, password });
            const { token: newToken, data: { user: newUser } } = response.data;
            handleAuthSuccess(newToken, newUser);
            return { success: true };
        } catch (error) {
            console.error('Sign In error:', error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoadingAuth(false)
        }
    };

    const signUp = async (name, email, password) => {
        setIsLoadingAuth(true);
        setAuthError(null); // Clear previous errors
        try {
            const response = await axios.post(`${backendUrl}/auth/signup`, { name, email, password });
            // Backend response structure: { status: "success", token: "...", data: { user: { ... } } }
            const { token: newToken, data: { user: newUser } } = response.data;
            handleAuthSuccess(newToken, newUser);
            return { success: true };
        } catch (error) {
            console.error('Sign Up error:', error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoadingAuth(false);
        }
    };


    const signOut = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthError(null);
        console.log("User signed out.");
    };

    const authContextValue = {
        isAuthenticated: !!token,
        user,
        token,
        authError,
        isLoadingAuth,
        signIn,
        signUp,
        signOut,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {!isInitialLoading && children}
        </AuthContext.Provider>
    );
};