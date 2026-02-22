// ============================================
// Professor Portal - Auth Context
// ============================================
// Fixed: Non-blocking profile fetch to prevent infinite loading on refresh

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from 'react';
import { createClient, type SupabaseClient, type Session, type User } from '@supabase/supabase-js';

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
    isLoading: boolean;           // True while checking session (fast)
    profileLoading: boolean;      // True while fetching profile (slow)
    isAuthenticated: boolean;
    signIn: (params: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safety timeout for profile fetch (10 seconds)
const PROFILE_FETCH_TIMEOUT = 10000;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!supabase && supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { autoRefreshToken: true, persistSession: true, storageKey: 'professor-portal-auth' },
        });
    }
    return supabase as SupabaseClient;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const mountedRef = useRef(true);

    // Profile fetch with timeout fallback
    const fetchProfile = useCallback(async (authUser: User): Promise<AuthUser | null> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROFILE_FETCH_TIMEOUT);

        try {
            const { data, error } = await getSupabase()
                ?.from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            clearTimeout(timeoutId);

            if (error) {
                console.warn('[AuthContext] Profile fetch error:', error.message);
                return null;
            }
            if (!data) {
                console.warn('[AuthContext] No profile data found for user:', authUser.id);
                return null;
            }
            return {
                id: data.id,
                email: data.email,
                fullName: data.full_name,
                role: data.role,
                isActive: data.is_active,
            };
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('[AuthContext] Profile fetch failed:', err);
            return null;
        }
    }, []);

    // Non-blocking profile fetch
    const loadProfileAsync = useCallback(async (authUser: User) => {
        if (!mountedRef.current) return;
        setProfileLoading(true);

        try {
            const profile = await fetchProfile(authUser);
            if (mountedRef.current) {
                setUser(profile);
            }
        } finally {
            if (mountedRef.current) {
                setProfileLoading(false);
            }
        }
    }, [fetchProfile]);

    useEffect(() => {
        mountedRef.current = true;

        const init = async () => {
            console.log('[AuthContext] Initializing auth...');

            try {
                const { data: { session: s } } = await getSupabase()?.auth.getSession() || { data: { session: null } };

                if (mountedRef.current) {
                    setSession(s);
                    // ✅ Set loading FALSE immediately after session check
                    setIsLoading(false);

                    // ✅ Profile fetch is NON-BLOCKING
                    if (s?.user) {
                        console.log('[AuthContext] Session found, fetching profile...');
                        loadProfileAsync(s.user);
                    } else {
                        console.log('[AuthContext] No session found');
                    }
                }
            } catch (err) {
                console.error('[AuthContext] Init error:', err);
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        init();

        // Auth state change listener
        const { data: { subscription } } = getSupabase()?.auth.onAuthStateChange(async (event, s) => {
            console.log('[AuthContext] Auth state changed:', event);

            if (mountedRef.current) {
                setSession(s);

                if (s?.user) {
                    loadProfileAsync(s.user);
                } else {
                    setUser(null);
                    setProfileLoading(false);
                }
            }
        }) || { data: { subscription: { unsubscribe: () => { } } } };

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
        };
    }, [loadProfileAsync]);

    const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
        setIsLoading(true);
        try {
            const { data, error } = await getSupabase()?.auth.signInWithPassword({ email, password }) || { data: null, error: { message: 'Not configured' } };
            if (error) return { success: false, error: error.message };
            if (!data?.session) return { success: false, error: 'Auth failed' };
            const profile = await fetchProfile(data.user!);
            if (!profile) return { success: false, error: 'Profile not found' };
            if (profile.role !== 'professor') {
                await getSupabase()?.auth.signOut();
                return { success: false, error: 'Access denied. Professor account required.' };
            }
            setSession(data.session);
            setUser(profile);
            return { success: true };
        } finally { setIsLoading(false); }
    }, [fetchProfile]);

    const signOut = useCallback(async () => {
        await getSupabase()?.auth.signOut();
        setUser(null);
        setSession(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, isLoading, profileLoading, isAuthenticated: !!session, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
