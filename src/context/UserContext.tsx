// src/context/UserContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/auth';
import { useAuth } from './AuthContext';
import { handleError } from '../utils/errorHandling';
import { encrypt, decrypt } from '../utils/encryption';
import type { Database } from '../types/supabase';
import { api } from '../lib/api';

interface UserContextType {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache key for localStorage
const PROFILE_CACHE_KEY = 'mofisc_user_profile';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper to get cached profile (AES-GCM encrypted)
const getCachedProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
        if (!cached) return null;

        const decrypted = await decrypt(cached);
        if (!decrypted) return null;

        const { data, timestamp } = JSON.parse(decrypted);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;

        return isExpired ? null : data;
    } catch {
        return null;
    }
};

// Helper to set cached profile (AES-GCM encrypted)
const setCachedProfile = async (userId: string, profile: UserProfile) => {
    try {
        const plaintext = JSON.stringify({
            data: profile,
            timestamp: Date.now()
        });
        const ciphertext = await encrypt(plaintext);
        localStorage.setItem(`${PROFILE_CACHE_KEY}_${userId}`, ciphertext);
    } catch {
        // Ignore encryption/storage errors — cache is best-effort
    }
};

const bootstrapOrganisationProfile = async (profile: UserProfile): Promise<UserProfile> => {
    if (profile.user_type !== 'organisation') return profile;

    const response = await api.post('/v1/organisations/bootstrap');
    const workspace = response.data?.workspace;
    if (!workspace?.organisation_id) {
        throw new Error('Organisation workspace setup did not complete');
    }

    return {
        ...profile,
        organisation_id: workspace.organisation_id,
        organisation_name: workspace.organisation_name,
        organisation_slug: workspace.organisation_slug,
        organisation_role: workspace.member_role,
    };
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch user profile with caching (Revolut-style optimistic UI)
    const fetchUserProfile = useCallback(async (userId: string, skipCache = false) => {
        setError(null);

        // Try to load from cache first (optimistic UI)
        if (!skipCache) {
            const cached = await getCachedProfile(userId);
            if (cached) {
                setProfile(cached);
                setLoading(false);
                // Still fetch fresh data in background (stale-while-revalidate)
                fetchFreshProfile(userId);
                return;
            }
        }

        setLoading(true);
        await fetchFreshProfile(userId);
    }, []);

    // Helper to fetch fresh profile from database
    const fetchFreshProfile = async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) throw error;

          if (!data) {
            // Create profile if missing
            const { data: userData } = await supabase.auth.getUser();
            const defaultProfile: Database['public']['Tables']['user_profiles']['Insert'] = {
              id: userId,
              email: userData.user?.email || '',
              user_type: userData.user?.user_metadata?.user_type || 'individual',
              full_name: userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || '',
              preferences: {},
              is_active: true
            };

            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert(defaultProfile)
              .select()
              .single();

            if (insertError) throw insertError;
            const profile = await bootstrapOrganisationProfile(newProfile as UserProfile);
            setProfile(profile);
            void setCachedProfile(userId, profile);
          } else {
            const profile = await bootstrapOrganisationProfile(data as UserProfile);
            setProfile(profile);
            void setCachedProfile(userId, profile);
          }
        } catch (error) {
          handleError(error, 'data', 'Failed to load user profile. Please try refreshing the page.');
          setError('Failed to load user profile. Please try refreshing the page.');
        } finally {
          setLoading(false);
        }
    };

    // Initialize user and profile
    useEffect(() => {
        if (user) {
            fetchUserProfile(user.id);
        } else {
            // Clear profile when user logs out
            setProfile(null);
            setLoading(false);
        }
    }, [user, fetchUserProfile]);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) throw new Error('No user logged in');

        // Optimistic update - update UI immediately
        const previousProfile = profile;
        if (profile) {
            const optimisticProfile = { ...profile, ...updates };
            setProfile(optimisticProfile);
            void setCachedProfile(user.id, optimisticProfile);
        }

        try {
            const dbUpdates: Database['public']['Tables']['user_profiles']['Update'] = {
                full_name: updates.full_name,
                email: updates.email,
                user_type: updates.user_type || profile?.user_type,
                phone: updates.phone,
                profile_picture: updates.profile_picture,
                preferences: updates.preferences,
                is_active: updates.is_active,
            };

            const { data, error } = await supabase
                .from('user_profiles')
                .update(dbUpdates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            const updatedProfile = data as UserProfile;
            setProfile(updatedProfile);
            void setCachedProfile(user.id, updatedProfile);
        } catch (error) {
            // Rollback on error
            if (previousProfile) {
                setProfile(previousProfile);
                void setCachedProfile(user.id, previousProfile);
            }
            handleError(error, 'data', 'Failed to update profile');
            throw error;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            setLoading(true);
            await fetchUserProfile(user.id, true); // Skip cache
        }
    };

    return (
        <UserContext.Provider value={{
            profile,
            loading,
            error,
            updateProfile,
            refreshProfile
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
