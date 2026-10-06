// src/components/Notifications/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { notificationService } from '../../services/notificationService';
import { ProviderStatus } from '../../types/Notification';
import { toast } from 'react-toastify';
import { secureLogger } from '../../utils/secureLogger';

const NotificationSettings: React.FC = () => {
  const { isInitialized, initializeNotifications } = useNotifications();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [testChannels, setTestChannels] = useState<string[]>(['in_app']);

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    try {
      const status = await notificationService.getProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      secureLogger.error('Failed to fetch provider status:', 'NotificationSettings', error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      await initializeNotifications();
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setLoading(true);
    try {
      await notificationService.sendTestNotification(
        testChannels,
        'This is a test notification from Galahad'
      );
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const toggleTestChannel = (channel: string) => {
    setTestChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>

      {/* Push Notifications */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Push Notifications</h3>
        <p className="text-sm text-gray-600 mb-4">
          Receive optional browser notifications when Galahad is in the background
        </p>

        {!isInitialized ? (
          <button
            onClick={handleEnableNotifications}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enabling...' : 'Enable Push Notifications'}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium">Push notifications enabled</span>
          </div>
        )}
      </div>

      {/* Provider Status */}
      {providerStatus && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Provider Status</h3>
          <div className="space-y-2">
            {Object.entries(providerStatus.providers).map(([channel, info]: [string, any]) => (
              <div key={channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium capitalize">{channel}</span>
                  <span className="text-sm text-gray-500 ml-2">({info.provider})</span>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    info.configured
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {info.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Notifications */}
      {providerStatus && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Test Notifications</h3>
          <p className="text-sm text-gray-600 mb-4">
            Send a test notification to verify your settings
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select channels to test:
            </label>
            <div className="space-y-2">
              {providerStatus?.providers &&
                Object.entries(providerStatus.providers).map(([channel, info]: [string, any]) => (
                  <label
                    key={channel}
                    className="flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={testChannels.includes(channel)}
                      onChange={() => toggleTestChannel(channel)}
                      disabled={!info.configured}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {channel}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <button
            onClick={handleSendTest}
            disabled={loading || testChannels.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Test Notification'}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to enable notifications:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Click "Enable Push Notifications" button</li>
          <li>Allow notifications when prompted by your browser</li>
          <li>Your device will be registered automatically</li>
          <li>You'll receive notifications for important events</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationSettings;
