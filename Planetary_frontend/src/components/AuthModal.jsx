import React, { useState, useEffect } from 'react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose }) => {
    const { signIn, signUp, isLoadingAuth, authError } = useAuth();

    const [isSigningUp, setIsSigningUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState(null);


    useEffect(() => {
        setLocalError(authError);
    }, [authError]);

    if (!isOpen) return null;

    const handleToggleMode = () => {
        setIsSigningUp(prev => !prev);
        setLocalError(null); // Clear errors when switching mode
        setName('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null); // Clear previous local errors

        if (!email || !password) {
            setLocalError("Email and password are required.");
            return;
        }

        if (isSigningUp && !name) {
            setLocalError("Name is required for signing up.");
            return;
        }

        let result;
        if (isSigningUp) {
            result = await signUp(name, email, password);
        } else {
            result = await signIn(email, password);
        }

        if (result.success) {
            onClose();
        }
    };

    return (

        <div
            className="fixed inset-0 bg-white/5 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >

            <div
                className="bg-white rounded-lg p-8 shadow-2xl relative w-full max-w-md mx-4 transform transition-all duration-300 scale-100 opacity-100"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                    aria-label="Close modal"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <h2 className="text-2xl font-bold text-center mb-6 text-light-text-primary">
                    {isSigningUp ? 'Sign Up' : 'Log In'}
                </h2>

                {localError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{localError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSigningUp && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary mb-1">Name</label>
                            <input
                                type="text"
                                id="name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent-purple focus:border-accent-purple"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={isSigningUp}
                                aria-required={isSigningUp}
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent-purple focus:border-accent-purple"
                            placeholder="your@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-required="true"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-light-text-secondary mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-accent-purple focus:border-accent-purple"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-required="true"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="w-full"
                        disabled={isLoadingAuth}
                    >
                        {isLoadingAuth ? (
                            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        ) : (
                            <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>
                        )}
                        {isLoadingAuth ? (isSigningUp ? 'Signing Up...' : 'Logging In...') : (isSigningUp ? 'Sign Up' : 'Log In')}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-light-text-secondary">
                    {isSigningUp ? (
                        <>
                            Already have an account?{' '}
                            <span
                                className="text-accent-purple font-medium cursor-pointer hover:underline"
                                onClick={handleToggleMode}
                            >
                                Log In
                            </span>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <span
                                className="text-accent-purple font-medium cursor-pointer hover:underline"
                                onClick={handleToggleMode}
                            >
                                Sign Up
                            </span>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default AuthModal;