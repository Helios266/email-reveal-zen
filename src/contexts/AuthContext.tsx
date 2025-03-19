
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

// Mock user type
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock auth data store
const USERS_STORAGE_KEY = 'mock_users';
const CURRENT_USER_KEY = 'current_user';

interface StoredUser extends User {
  password: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Initialize or load mock users
  const initializeUsers = () => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!storedUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
    }
  };

  // Load current user on mount
  useEffect(() => {
    initializeUsers();
    
    const currentUserJson = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      try {
        const currentUser = JSON.parse(currentUserJson);
        setUser(currentUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
    
    setLoading(false);
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing users
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
      const users: StoredUser[] = JSON.parse(storedUsers);
      
      // Check if user already exists
      if (users.some(u => u.email === email)) {
        throw new Error('User already exists');
      }
      
      // Create new user
      const newUser: StoredUser = {
        id: Math.random().toString(36).substring(2, 11),
        email,
        password, // In a real app, this would be hashed
        name
      };
      
      // Save new user
      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      
      toast.success(t('Sign up successful! Please check your email for verification.'));
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Something went wrong'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing users
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
      const users: StoredUser[] = JSON.parse(storedUsers);
      
      // Find user
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Create session (without password)
      const sessionUser: User = {
        id: user.id,
        email: user.email,
        name: user.name
      };
      
      // Save user to local storage
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      
      toast.success(t('Logged in successfully'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Something went wrong'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear user session
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      
      toast.success(t('Logged out successfully'));
      navigate('/login');
    } catch (error) {
      toast.error(t('Something went wrong'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing users
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
      const users: StoredUser[] = JSON.parse(storedUsers);
      
      // Check if user exists
      const userExists = users.some(u => u.email === email);
      if (!userExists) {
        throw new Error('No account found with this email');
      }
      
      toast.success(t('Reset link sent to your email'));
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Something went wrong'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
