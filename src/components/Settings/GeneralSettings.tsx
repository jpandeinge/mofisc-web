import React, { useEffect, useState } from 'react';
import { FiLock, FiMail, FiUser, FiShield, FiBell, FiAlertCircle, FiMapPin, FiAlertTriangle } from 'react-icons/fi';
import { Smartphone, Monitor, Trash2, Laptop, Tablet, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useMFA } from '../../context/MFAContext';
import { useDeviceTrust } from '../../context/DeviceTrustContext';
import { supabase } from '../../lib/supabase';
import { colors, withOpacity } from '../../styles/colors';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
  resolveNotificationPreferences,
} from '../../config/notificationConstants';
import MFASetupModal from '../Security/MFASetupModal';

// Helper function to format relative time like "Active now", "2 hours ago", "Yesterday"
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 2) return 'Active now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

// Get appropriate device icon based on OS/device type
const getDeviceIcon = (os: string | null, browser: string | null) => {
  const osLower = (os || '').toLowerCase();
  const browserLower = (browser || '').toLowerCase();

  if (osLower.includes('iphone') || osLower.includes('android')) return Smartphone;
  if (osLower.includes('ipad') || browserLower.includes('tablet')) return Tablet;
  if (osLower.includes('mac') || osLower.includes('windows') || osLower.includes('linux')) return Laptop;

  return Monitor;
};

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className="relative h-6 w-11 flex-shrink-0 rounded-full bg-[#5F6368]/20 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)] focus:ring-offset-2"
  >
    <div
      className="absolute w-11 h-6 rounded-full transition-colors duration-200 ease-in-out"
      style={{
        backgroundColor: checked ? 'var(--accent-color)' : 'transparent'
      }}
    />
    <div
      className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out"
      style={{
        transform: `translateX(${checked ? '20px' : '0px'})`
      }}
    />
  </button>
);

const Section = ({ title, description, children }: any) => (
  <div className="bg-gradient-to-r from-[#F1F3F4]/90 via-[#FFFFFF]/90 to-[#F1F3F4]/90
                 backdrop-blur-sm rounded-xl border border-[#5F6368]/20 p-6 mb-6">
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[color:var(--text-secondary)]">{description}</p>
    </div>
    {children}
  </div>
);

interface NotificationItemProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  description,
  checked,
  onChange,
}) => (
  <div className="min-h-[72px] flex items-center p-4 bg-[#F1F3F4]/50 rounded-lg border border-[#5F6368]/20">
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-4 flex-grow">
        <FiBell className="h-5 w-5 text-[color:var(--accent-color)] flex-shrink-0" />
        <div className="flex-grow">
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-xs text-[color:var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <Toggle checked={checked} onChange={onChange} label={title} />
      </div>
    </div>
  </div>
);

type InputIcon = React.ComponentType<{ className?: string }>;

type InputFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  icon: InputIcon;
  disabled?: boolean;
  allowToggle?: boolean;
  isPasswordVisible?: boolean;
  onToggleVisibility?: () => void;
  type?: React.HTMLInputTypeAttribute;
};

const InputField: React.FC<InputFieldProps> = ({
  icon: Icon,
  disabled = false,
  allowToggle = false,
  isPasswordVisible = false,
  onToggleVisibility,
  type = 'text',
  ...props
}) => {
  const inputType = allowToggle ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-[color:var(--accent-color)]" />
      </div>
      <input
        className={`h-12 w-full pl-10 pr-4 bg-[#F1F3F4]/50 border border-[#5F6368]/20
                 rounded-lg focus:ring-[color:var(--accent-color)] focus:border-[color:var(--accent-color)]
                 text-sm transition-colors ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        type={inputType}
        disabled={disabled}
        {...props}
      />
      {allowToggle && (
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-[color:var(--accent-color)] hover:opacity-80"
          tabIndex={-1}
        >
          {isPasswordVisible ? 'Hide' : 'Show'}
        </button>
      )}
    </div>
  );
};

const GeneralSettings: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const { profile, updateProfile } = useUser();
  const { factors, hasMFA, unenrollMFA, loading: mfaLoading } = useMFA();
  const { devices, currentFingerprint, trustDevice, removeDevice, removeAllDevices, loading: deviceLoading } = useDeviceTrust();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [disablingMFA, setDisablingMFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load profile data only once on mount - using a ref to track if we've initialized
  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      setFormData({
        fullName: profile.full_name || '',
        email: profile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Load notification preferences from profile
      const prefs = profile.preferences as any;
      if (prefs?.notifications) {
        setNotifications(resolveNotificationPreferences(prefs.notifications));
      }

      // Mark as initialized - this will never reset
      initializedRef.current = true;
    }
  }, [profile]);

  // Check if user signed up with Google
  useEffect(() => {
    const checkAuthProvider = async () => {
      if (user) {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user) {
          // Check if user has Google as an identity provider
          const hasGoogleProvider = data.user.identities?.some(
            identity => identity.provider === 'google'
          );
          // Identity membership is authoritative for linked accounts. The
          // app_metadata provider can reflect only the latest provider used.
          const hasEmailIdentity = data.user.identities?.some(
            identity => identity.provider === 'email'
          );
          setIsGoogleUser(hasGoogleProvider === true && !hasEmailIdentity);
        }
      }
    };

    checkAuthProvider();
  }, [user]);

  // Validate password strength
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  };

  // Handle name change request
  const handleNameChangeRequest = () => {
    window.location.href =
      'mailto:support@galahad.com?subject=Name%20Change%20Request&body=Please%20include%20your%20legal%20name%2C%20account%20email%2C%20and%20supporting%20documentation.';
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // For Google users, they're setting a password for the first time
    if (isGoogleUser) {
      if (!formData.newPassword) {
        toast.error('Please enter a password');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Validate password strength
      const errors = validatePassword(formData.newPassword);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        toast.error('Password does not meet requirements');
        return;
      }

      setPasswordErrors([]);
      setPasswordLoading(true);

      try {
        // Set password for Google user
        await updatePassword(formData.newPassword);

        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));

        // Update state to reflect they now have a password
        setIsGoogleUser(false);

      } catch (error: any) {
        toast.error(error.message || 'Failed to set password');
      } finally {
        setPasswordLoading(false);
      }
      return;
    }

    // For email users, verify current password
    if (!formData.currentPassword || !formData.newPassword) {
      toast.error('Please enter both current and new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Validate password strength
    const errors = validatePassword(formData.newPassword);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      toast.error('Password does not meet requirements');
      return;
    }

    setPasswordErrors([]);
    setPasswordLoading(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await updatePassword(formData.newPassword);

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle notifications update
  const handlePreferencesUpdate = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await updateProfile({
        preferences: {
          ...(profile.preferences as any),
          notifications,
        },
      });
      toast.success('Notification preferences saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChannelChange = async (
    channel: keyof typeof notifications,
    checked: boolean
  ) => {
    setNotifications((current) => ({
      ...current,
      [channel]: checked,
    }));
  };

  // Handle MFA disable
  const handleDisableMFA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    const verifiedFactor = factors.find(f => f.status === 'verified');
    if (!verifiedFactor) return;

    setDisablingMFA(true);
    try {
      await unenrollMFA(verifiedFactor.id);
    } finally {
      setDisablingMFA(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update preferences (notifications and 2FA)
    await handlePreferencesUpdate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Section
          title="Profile Information"
          description="Your verified identity information for compliance and security"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Full Name</span>
                <span className="text-xs text-[color:var(--text-secondary)] font-normal">
                  Verified Identity
                </span>
              </label>
              <InputField
                icon={FiUser}
                type="text"
                autoComplete="name"
                value={formData.fullName}
                disabled
              />
              <p className="text-xs text-[color:var(--text-secondary)] mt-1">
                For security and compliance, name changes require verification.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <InputField
                icon={FiMail}
                type="email"
                autoComplete="email"
                value={formData.email}
                disabled
              />
              <p className="text-xs text-[color:var(--text-secondary)] mt-1">
                Email cannot be changed for security reasons.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#F1F3F4]/50 rounded-lg border border-[#5F6368]/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Need to update your name?</h4>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  Name changes require identity verification and supporting documentation (e.g., marriage certificate, legal name change).
                  Contact our support team to initiate the verification process.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNameChangeRequest}
                className="ml-4 px-4 py-2 bg-[color:var(--accent-color)] text-white rounded-lg
                         font-medium text-sm hover:bg-opacity-90 transition-colors duration-200
                         whitespace-nowrap flex-shrink-0"
              >
                Request Name Change
              </button>
            </div>
          </div>
        </Section>

        <Section
          title="Security"
          description="Manage your password and two-factor authentication settings"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {isGoogleUser ? 'Set Password' : 'Change Password'}
                </h4>
                {isGoogleUser && (
                  <span className="text-xs text-[color:var(--text-secondary)] bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                    Google Sign-In User
                  </span>
                )}
              </div>

              {isGoogleUser && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-300">
                    You signed in with Google. Setting a password will allow you to also sign in using email and password.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {!isGoogleUser && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <InputField
                      icon={FiLock}
                      type="password"
                      autoComplete="current-password"
                      allowToggle
                      isPasswordVisible={showCurrentPassword}
                      onToggleVisibility={() => setShowCurrentPassword(prev => !prev)}
                      value={formData.currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <InputField
                      icon={FiLock}
                      type="password"
                      autoComplete="new-password"
                      allowToggle
                      isPasswordVisible={showNewPassword}
                      onToggleVisibility={() => setShowNewPassword(prev => !prev)}
                      value={formData.newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFormData(prev => ({ ...prev, newPassword: e.target.value }));
                        if (passwordErrors.length > 0) {
                          setPasswordErrors(validatePassword(e.target.value));
                        }
                      }}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <InputField
                      icon={FiLock}
                      type="password"
                      autoComplete="new-password"
                      allowToggle
                      isPasswordVisible={showConfirmPassword}
                      onToggleVisibility={() => setShowConfirmPassword(prev => !prev)}
                      value={formData.confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords must match.</p>
                    )}
                  </div>
                </div>

                {passwordErrors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <FiAlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-400 mb-2">Password requirements:</p>
                        <ul className="text-xs text-red-300 space-y-1">
                          {passwordErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={
                      passwordLoading ||
                      !formData.newPassword ||
                      formData.newPassword !== formData.confirmPassword ||
                      (!isGoogleUser && !formData.currentPassword)
                    }
                    className="px-6 py-2 bg-[color:var(--accent-color)] text-white rounded-lg
                             font-medium text-sm hover:bg-opacity-90 disabled:opacity-50
                             disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {passwordLoading
                      ? (isGoogleUser ? 'Setting Password...' : 'Updating Password...')
                      : (isGoogleUser ? 'Set Password' : 'Update Password')
                    }
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#5F6368]/20 pt-6"></div>
          </div>

          {/* MFA Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-[#F1F3F4]/50 rounded-lg border border-[#5F6368]/20">
              <div className="flex items-start space-x-4 flex-grow">
                <Smartphone className="h-5 w-5 text-[color:var(--accent-color)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                    {hasMFA && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-semibold text-green-600">
                        <FiShield className="h-3 w-3" />
                        Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    {hasMFA
                      ? 'Your account is protected with authenticator app'
                      : 'Add an extra layer of security to your account'
                    }
                  </p>

                  {hasMFA && (
                    <div className="mt-3 space-y-2">
                      {factors.filter(f => f.status === 'verified').map((factor) => (
                        <div key={factor.id} className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                          <Smartphone className="h-3 w-3" />
                          <span>Authenticator App - Added {new Date(factor.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 ml-4">
                {hasMFA ? (
                  <button
                    onClick={handleDisableMFA}
                    disabled={disablingMFA || mfaLoading}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10
                             rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {disablingMFA ? 'Disabling...' : 'Disable'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowMFAModal(true)}
                    disabled={mfaLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[color:var(--accent-color)]
                             hover:bg-opacity-90 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Trusted Devices"
          description="Manage devices that have access to your account"
        >
          <div className="space-y-3">
            {/* Loading skeleton */}
            {deviceLoading && devices.length === 0 && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-xl animate-pulse" style={{ backgroundColor: colors.background.secondary }}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: withOpacity(colors.text.tertiary, 0.2) }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded" style={{ backgroundColor: withOpacity(colors.text.tertiary, 0.2) }} />
                        <div className="h-3 w-48 rounded" style={{ backgroundColor: withOpacity(colors.text.tertiary, 0.15) }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {devices.length === 0 && !deviceLoading && (
              <div
                className="p-8 rounded-xl text-center"
                style={{ backgroundColor: colors.background.secondary, border: `1px dashed ${colors.border.light}` }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: withOpacity(colors.primary.main, 0.1) }}
                >
                  <Laptop className="h-8 w-8" style={{ color: colors.primary.main }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: colors.text.primary }}>No devices yet</p>
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  Your trusted devices will appear here after you log in
                </p>
              </div>
            )}

            {/* Device list */}
            {devices.map((device) => {
              const isCurrentDevice = device.is_current_device || device.fingerprint === currentFingerprint;
              const DeviceIcon = getDeviceIcon(device.os, device.browser);
              const relativeTime = formatRelativeTime(device.last_used_at);
              const isActiveNow = relativeTime === 'Active now';

              return (
                <div
                  key={device.id}
                  className="relative p-4 rounded-xl transition-all duration-200 hover:shadow-sm"
                  style={{
                    backgroundColor: isCurrentDevice
                      ? withOpacity(colors.primary.main, 0.08)
                      : colors.background.secondary,
                    border: `1px solid ${
                      device.is_suspicious
                        ? withOpacity(colors.status.warning, 0.5)
                        : isCurrentDevice
                        ? withOpacity(colors.primary.main, 0.3)
                        : colors.border.light
                    }`
                  }}
                >
                  {/* Suspicious device warning banner */}
                  {device.is_suspicious && (
                    <div
                      className="absolute -top-px left-4 right-4 px-3 py-1 rounded-b-lg flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: colors.status.warning }}
                    >
                      <FiAlertTriangle className="h-3 w-3 text-white" />
                      <span className="text-xs font-medium text-white">Unusual location detected</span>
                    </div>
                  )}

                  <div className={`flex items-start gap-4 ${device.is_suspicious ? 'mt-4' : ''}`}>
                    {/* Device icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isCurrentDevice
                          ? withOpacity(colors.primary.main, 0.15)
                          : withOpacity(colors.text.secondary, 0.1)
                      }}
                    >
                      <DeviceIcon
                        className="h-6 w-6"
                        style={{ color: isCurrentDevice ? colors.primary.main : colors.text.secondary }}
                      />
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                          {device.friendly_name || `${device.browser || 'Unknown'} on ${device.os || 'Unknown'}`}
                        </h4>

                        {/* Status badges */}
                        {isCurrentDevice && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: withOpacity(colors.status.success, 0.15), color: colors.status.success }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.status.success }} />
                            This device
                          </span>
                        )}

                        {device.is_trusted && !isCurrentDevice && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: withOpacity(colors.primary.main, 0.1), color: colors.primary.main }}
                          >
                            <FiShield className="h-3 w-3" />
                            Trusted
                          </span>
                        )}
                      </div>

                      {/* Location and time */}
                      <div className="flex items-center gap-3 text-xs" style={{ color: colors.text.secondary }}>
                        {(device.location || device.last_login_location) && (
                          <span className="flex items-center gap-1">
                            <FiMapPin className="h-3 w-3" />
                            {device.last_login_location || device.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isActiveNow ? 'animate-pulse' : ''}`}
                            style={{ backgroundColor: isActiveNow ? colors.status.success : colors.text.tertiary }}
                          />
                          {relativeTime}
                        </span>
                      </div>

                      {/* Login count for non-current devices */}
                      {!isCurrentDevice && device.login_count > 1 && (
                        <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                          {device.login_count} sessions · First seen {new Date(device.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!device.is_trusted && !isCurrentDevice && (
                        <button
                          onClick={() => trustDevice(device.id)}
                          disabled={deviceLoading}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50"
                          style={{
                            backgroundColor: colors.primary.main,
                            color: colors.text.inverse,
                          }}
                        >
                          Trust
                        </button>
                      )}
                      {!isCurrentDevice && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove "${device.friendly_name || 'this device'}" from your trusted devices?`)) {
                              removeDevice(device.id);
                            }
                          }}
                          disabled={deviceLoading}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 hover:bg-red-50"
                          style={{ color: colors.status.error }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Sign out all devices button */}
            {devices.length > 1 && (
              <div className="pt-4 border-t" style={{ borderColor: colors.border.light }}>
                <button
                  onClick={() => {
                    if (window.confirm('Sign out of all other devices? You\'ll stay logged in on this device, but all other sessions will be terminated.')) {
                      removeAllDevices();
                    }
                  }}
                  disabled={deviceLoading}
                  className="w-full py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    border: `1px solid ${withOpacity(colors.status.error, 0.3)}`,
                    color: colors.status.error,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = withOpacity(colors.status.error, 0.05)}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Globe className="h-4 w-4" />
                  Sign out of all other devices
                </button>
              </div>
            )}

            {/* Security tip */}
            {devices.length > 0 && (
              <div
                className="mt-4 p-3 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: withOpacity(colors.primary.main, 0.05) }}
              >
                <FiShield className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: colors.primary.main }} />
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  <span className="font-medium" style={{ color: colors.text.primary }}>Security tip:</span>{' '}
                  Remove devices you don't recognize. If you see suspicious activity, change your password immediately.
                </p>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Notifications"
          description="Choose whether updates appear in Galahad, arrive by email, or both"
        >
          <div className="space-y-4">
            {([
              {
                key: 'in_app',
                title: 'In-app notifications',
                description: 'Show live updates and keep them in your notification inbox',
              },
              {
                key: 'email',
                title: 'Email notifications',
                description: 'Send important financial updates to your account email',
              },
            ] as const).map(({ key, title, description }) => (
              <NotificationItem
                key={key}
                title={title}
                description={description}
                checked={notifications[key]}
                onChange={(checked: boolean) => {
                  void handleNotificationChannelChange(
                    key as keyof NotificationPreferences,
                    checked
                  );
                }}
              />
            ))}
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            disabled={loading}
            type="submit"
            className="h-12 px-8 bg-[color:var(--accent-color)] text-white rounded-lg
                     font-medium text-sm focus:outline-none focus:ring-2
                     focus:ring-[color:var(--accent-color)] focus:ring-offset-2
                     hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            {loading ? 'Saving preferences…' : 'Save notification preferences'}
          </button>
        </div>
      </form>

      {/* MFA Setup Modal */}
      <MFASetupModal isOpen={showMFAModal} onClose={() => setShowMFAModal(false)} />
    </div>
  );
};

export default GeneralSettings;
