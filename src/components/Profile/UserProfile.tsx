// src/components/Profile/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import { secureLogger } from '../../utils/secureLogger';

// Define the form data type with strict user_type values
interface FormData {
  full_name: string;
  phone: string;
  user_type: 'individual' | 'organisation';
}

const UserProfile: React.FC = () => {
    const { profile, updateProfile, loading: userLoading, error: userError } = useUser();
    const { isGoogleLinked, linkGoogleAccount, loading: authLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [googleLinked, setGoogleLinked] = useState(false);
    const [checkingOAuth, setCheckingOAuth] = useState(true);

    // Initialize form data with correct typing
    const [formData, setFormData] = useState<FormData>({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        user_type: profile?.user_type || 'individual'
    });

    // Update form data when profile changes
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name,
                phone: profile.phone || '',
                user_type: profile.user_type
            });
        }
    }, [profile]);

    // Check if Google account is linked
    useEffect(() => {
        const checkGoogleLink = async () => {
            try {
                const isLinked = await isGoogleLinked();
                setGoogleLinked(isLinked);
            } catch (error) {
                secureLogger.error('Failed to check linked accounts:', 'UserProfile', error);
            } finally {
                setCheckingOAuth(false);
            }
        };

        checkGoogleLink();
    }, [isGoogleLinked]);

    useEffect(() => {
        if (localStorage.getItem('account_linking_success') === 'true') {
            localStorage.removeItem('account_linking_success');
            setGoogleLinked(true);
            toast.success('Google account linked successfully.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile(formData);
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    // Handle Google account linking
    const handleLinkGoogle = async () => {
        try {
            await linkGoogleAccount();
            // Redirect happens automatically and results are handled in the callback
        } catch (error) {
            toast.error('Failed to link Google account');
        }
    };

    // Type-safe handler for user_type changes
    const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as 'individual' | 'organisation';
        setFormData(prev => ({ ...prev, user_type: value }));
    };

    const loading = userLoading || authLoading;

    if (loading && !profile) {
        return <div className="flex items-center justify-center p-4">Loading...</div>;
    }

    if (userError) {
        return <div className="text-red-500 p-4">{userError}</div>;
    }

    if (!profile) {
        return <div className="text-gray-500 p-4">No profile found</div>;
    }

    return (
        <div className="bg-[color:var(--bg-secondary)] rounded-lg shadow p-6">
            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-primary)]">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-[color:var(--border-color)] bg-[color:var(--bg-primary)] shadow-sm focus:border-[color:var(--accent-color)] focus:ring-[color:var(--accent-color)]"
                            required
                        />
                    </div>

                    {/* Phone Input */}
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-primary)]">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-[color:var(--border-color)] bg-[color:var(--bg-primary)] shadow-sm focus:border-[color:var(--accent-color)] focus:ring-[color:var(--accent-color)]"
                        />
                    </div>

                    {/* Account Type Select */}
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-primary)]">
                            Account Type
                        </label>
                        <select
                            value={formData.user_type}
                            onChange={handleUserTypeChange}
                            className="mt-1 block w-full rounded-md border-[color:var(--border-color)] bg-[color:var(--bg-primary)] shadow-sm focus:border-[color:var(--accent-color)] focus:ring-[color:var(--accent-color)]"
                        >
                            <option value="individual">Individual</option>
                            <option value="organisation">Organisation</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-[color:var(--border-color)] rounded-md text-[color:var(--text-primary)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[color:var(--accent-color)] text-white rounded-md hover:bg-[color:var(--button-active)]"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                            Profile Information
                        </h2>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-[color:var(--accent-color)] text-white rounded-md hover:bg-[color:var(--button-active)]"
                        >
                            Edit Profile
                        </button>
                    </div>

                    {/* Profile Information Display */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-[color:var(--text-secondary)]">Full Name</span>
                            <span className="text-[color:var(--text-primary)]">{profile.full_name}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm text-[color:var(--text-secondary)]">Email</span>
                            <span className="text-[color:var(--text-primary)]">{profile.email}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm text-[color:var(--text-secondary)]">Phone</span>
                            <span className="text-[color:var(--text-primary)]">
                                {profile.phone || 'Not provided'}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm text-[color:var(--text-secondary)]">Account Type</span>
                            <span className="text-[color:var(--text-primary)] capitalize">
                                {profile.user_type}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm text-[color:var(--text-secondary)]">Member Since</span>
                            <span className="text-[color:var(--text-primary)]">
                                {new Date(profile.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Linked Accounts Section */}
                    <div className="mt-8">
                        <h3 className="text-lg font-medium text-[color:var(--text-primary)] mb-4">
                            Linked Accounts
                        </h3>
                        <div className="border border-[color:var(--border-color)] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FcGoogle className="h-6 w-6" aria-hidden="true" />
                                    <span className="text-[color:var(--text-primary)]">Google</span>
                                </div>

                                {checkingOAuth ? (
                                    <span className="text-sm text-[color:var(--text-secondary)]" role="status">Checking…</span>
                                ) : googleLinked ? (
                                    <span className="text-sm text-green-500">Connected</span>
                                ) : (
                                    <button
                                        onClick={handleLinkGoogle}
                                        className="px-3 py-1 bg-[color:var(--accent-color)] text-white text-sm rounded-md hover:bg-[color:var(--button-active)]"
                                        disabled={authLoading}
                                        aria-busy={authLoading}
                                    >
                                        {authLoading ? 'Connecting…' : 'Connect Google'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
                            Linking accounts allows you to sign in with your social accounts and enhances account security.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
