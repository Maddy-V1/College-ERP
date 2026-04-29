// ============================================
// Admin Portal - Auth Context (DEV MODE)
// ============================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { createClient, type SupabaseClient, type Session, type User } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
}

interface AuthContextValue {
    user: AuthUser | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (params: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
}

// ============================================
// Supabase Client
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                storageKey: 'admin-portal-auth',
            },
        });
    }
    return supabase;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile from database with timeout
    const fetchUserProfile = useCallback(async (authUser: User): Promise<AuthUser | null> => {
        const client = getSupabase();
        if (!client) return null;

        try {
            // Add a 3-second timeout
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            const queryPromise = client
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;

            if (error || !data) {
                // FALLBACK: Create user object from auth data
                console.log('ℹ️ Using fallback user from auth data');
                return {
                    id: authUser.id,
                    email: authUser.email || '',
                    fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Admin',
                    role: 'admin', // Default to admin for admin portal
                    isActive: true,
                };
            }

            return {
                id: data.id,
                email: data.email,
                fullName: data.full_name,
                role: data.role,
                isActive: data.is_active,
            };
        } catch (err) {
            // FALLBACK on error/timeout
            console.log('ℹ️ Using fallback user (query failed/timeout)');
            return {
                id: authUser.id,
                email: authUser.email || '',
                fullName: authUser.email?.split('@')[0] || 'Admin',
                role: 'admin',
                isActive: true,
            };
        }
    }, []);

    // Initialize auth
    useEffect(() => {
        let mounted = true;
        const client = getSupabase();

        if (!client) {
            setIsLoading(false);
            return;
        }

        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await client.auth.getSession();

                if (mounted && currentSession?.user) {
                    setSession(currentSession);
                    const profile = await fetchUserProfile(currentSession.user);
                    setUser(profile);
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = client.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (mounted) {
                    setSession(newSession);
                    if (newSession?.user) {
                        const profile = await fetchUserProfile(newSession.user);
                        setUser(profile);
                    } else {
                        setUser(null);
                    }
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserProfile]);

    // Sign in
    const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
        const client = getSupabase();
        if (!client) {
            return { success: false, error: 'Supabase not configured' };
        }

        try {
            const { data, error } = await client.auth.signInWithPassword({ email, password });

            if (error) {
                return { success: false, error: error.message };
            }

            if (!data.session || !data.user) {
                return { success: false, error: 'Authentication failed' };
            }

            const profile = await fetchUserProfile(data.user);
            setSession(data.session);
            setUser(profile);
            return { success: true };
        } catch (err) {
            return { success: false, error: 'An unexpected error occurred' };
        }
    }, [fetchUserProfile]);

    // Sign out
    const signOut = useCallback(async () => {
        const client = getSupabase();
        if (client) {
            await client.auth.signOut();
        }
        setUser(null);
        setSession(null);
    }, []);

    const value: AuthContextValue = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        signIn,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
