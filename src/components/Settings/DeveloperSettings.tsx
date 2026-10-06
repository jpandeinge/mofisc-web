// src/components/Settings/DeveloperSettings.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCopy, FiKey, FiTrash2, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiDownload, FiExternalLink } from 'react-icons/fi';
import { apiKeyService, ApiKeyRecord, ApiKeyUsageSummary } from '../../services/apiKeyService';
import { colors, withOpacity } from '../../styles/colors';
import { toast } from 'react-toastify';
import { secureLogger } from '../../utils/secureLogger';

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusPill = (record: ApiKeyRecord) => {
  if (!record.is_active) return { label: 'Revoked', color: colors.status.error };
  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    return { label: 'Expired', color: colors.status.warning };
  }
  return { label: 'Active', color: colors.status.success };
};

const scopeOptions = [
  { id: 'transactions', label: 'Transactions', description: 'Upload statements and list transactions' },
  { id: 'budgets', label: 'Budgets', description: 'Create budgets and view status' },
  { id: 'goals', label: 'Goals', description: 'Manage savings goals' },
  { id: 'subscriptions', label: 'Subscriptions', description: 'Read and manage subscriptions' },
  { id: 'achievements', label: 'Achievements', description: 'Fetch achievements and streaks' },
  { id: 'metrics', label: 'Metrics', description: 'Financial and activity metrics' },
  { id: 'calculators', label: 'Calculators', description: 'Access calculator history' },
  { id: 'notifications', label: 'Notifications', description: 'Read notification history' },
  { id: 'security', label: 'Security', description: 'Device trust and security checks' },
  { id: 'users', label: 'Users', description: 'Profile and account metadata' },
] as const;

type AccessMode = 'full' | 'read' | 'custom';

const buildDefaultScopes = () =>
  scopeOptions.reduce<Record<string, { read: boolean; write: boolean }>>((acc, option) => {
    acc[option.id] = { read: true, write: false };
    return acc;
  }, {});

const getScopeLabel = (scopes: string[] = []) => {
  if (scopes.includes('*')) return 'Full access';
  if (scopes.length === 0) return 'No scopes';
  if (scopes.includes('*:read') && scopes.length === 1) return 'Read-only';
  const allRead = scopes.every((scope) => scope.endsWith(':read'));
  return allRead ? 'Read-only' : 'Custom';
};

const DeveloperSettings: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [usage, setUsage] = useState<ApiKeyUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [accessMode, setAccessMode] = useState<AccessMode>('full');
  const [customScopes, setCustomScopes] = useState<Record<string, { read: boolean; write: boolean }>>(() => buildDefaultScopes());

  const loadKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [keysResult, usageResult] = await Promise.allSettled([
        apiKeyService.list(),
        apiKeyService.getUsage(7),
      ]);

      if (keysResult.status === 'fulfilled') {
        setKeys(keysResult.value);
      } else {
        const keysError = keysResult.reason as any;
        const status = keysError?.response?.status;
        setError(status === 401 ? 'Please sign in to view API keys.' : 'Failed to load API keys. Please try again.');
        secureLogger.error('DeveloperSettings', 'Failed to load API keys', keysError);
      }

      if (usageResult.status === 'fulfilled') {
        setUsage(usageResult.value);
      } else {
        const usageError = usageResult.reason as any;
        secureLogger.error('DeveloperSettings', 'Failed to load API key usage', usageError);
        setUsage(null);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 401 ? 'Please sign in to view API keys.' : 'Failed to load API keys. Please try again.');
      secureLogger.error('DeveloperSettings', 'Failed to load API keys', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const buildScopes = () => {
    if (accessMode === 'full') return ['*'];
    if (accessMode === 'read') return ['*:read'];
    const scopes: string[] = [];
    Object.entries(customScopes).forEach(([resource, config]) => {
      if (config.read) scopes.push(`${resource}:read`);
      if (config.write) scopes.push(`${resource}:write`);
    });
    return scopes;
  };

  const handleScopeToggle = (resource: string, type: 'read' | 'write') => {
    setCustomScopes((prev) => {
      const next = { ...prev };
      const current = next[resource] || { read: false, write: false };
      if (type === 'read') {
        const newRead = !current.read;
        next[resource] = { read: newRead, write: newRead ? current.write : false };
      } else {
        const newWrite = !current.write;
        next[resource] = { read: newWrite ? true : current.read, write: newWrite };
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!keyName.trim()) {
      toast.error('Please provide a key name');
      return;
    }

    try {
      const scopes = buildScopes();
      if (scopes.length === 0) {
        toast.error('Select at least one scope');
        return;
      }
      setIsCreating(true);
      const payload = {
        name: keyName.trim(),
        scopes,
        expires_at: expiryDate ? new Date(expiryDate).toISOString() : null,
      };
      const result = await apiKeyService.create(payload);
      setRevealedKey(result.api_key);
      setKeyName('');
      setExpiryDate('');
      await loadKeys();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Please sign in to create API keys');
      } else {
        toast.error('Failed to create API key');
      }
      secureLogger.error('DeveloperSettings', 'Failed to create API key', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      setIsRevoking(keyId);
      await apiKeyService.revoke(keyId);
      await loadKeys();
    } catch (err) {
      toast.error('Failed to revoke API key');
      secureLogger.error('DeveloperSettings', 'Failed to revoke API key', err);
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRotate = async (record: ApiKeyRecord) => {
    if (!record.is_active) return;
    const confirmed = window.confirm(`Rotate API key "${record.name}"? This will revoke the old key.`);
    if (!confirmed) return;
    try {
      setIsRotating(record.id);
      const dateLabel = new Date().toLocaleDateString('en-US');
      const scopes = record.scopes && record.scopes.length > 0 ? record.scopes : ['*'];
      const payload = {
        name: `${record.name} (rotated ${dateLabel})`,
        scopes,
        expires_at: record.expires_at || null,
      };
      const result = await apiKeyService.create(payload);
      setRevealedKey(result.api_key);
      await apiKeyService.revoke(record.id);
      await loadKeys();
    } catch (err) {
      toast.error('Failed to rotate API key');
      secureLogger.error('DeveloperSettings', 'Failed to rotate API key', err);
    } finally {
      setIsRotating(null);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
    } catch (err) {
      toast.error('Unable to copy key');
      secureLogger.error('DeveloperSettings', 'Failed to copy API key', err);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await apiKeyService.exportUsage(7);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-usage-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export usage');
      secureLogger.error('DeveloperSettings', 'Failed to export usage', err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeCount = useMemo(
    () => keys.filter((record) => record.is_active).length,
    [keys]
  );

  const usageSummary = useMemo(() => {
    if (!usage) return null;
    const topEndpoint = usage.top_endpoints?.[0]?.endpoint || '—';
    return {
      totalRequests: usage.total_requests,
      errorRate: usage.error_rate,
      topEndpoint,
      daily: usage.daily || [],
    };
  }, [usage]);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: colors.text.primary, fontSize: 20, fontWeight: 600, marginBottom: 6 }}>
          Developer API Keys
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: 14 }}>
          Create and manage API keys for developer usage. Keys inherit your account permissions and plan limits.
        </p>
      </div>

      <div
        style={{
          backgroundColor: withOpacity(colors.primary.main, 0.06),
          border: `1px solid ${withOpacity(colors.primary.main, 0.2)}`,
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.primary, marginBottom: 4 }}>
            API Reference
          </div>
          <div style={{ fontSize: 12, color: colors.text.secondary }}>
            Authentication, scopes, examples, and error handling for developer integrations.
          </div>
        </div>
        <Link
          to="/api-reference"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 10,
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.border.light}`,
            color: colors.text.primary,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Open API Reference
          <FiExternalLink />
        </Link>
      </div>

      {revealedKey && (
        <div
          style={{
            border: `1px solid ${withOpacity(colors.status.success, 0.4)}`,
            backgroundColor: withOpacity(colors.status.success, 0.08),
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiCheckCircle color={colors.status.success} />
                <span style={{ fontWeight: 600, color: colors.text.primary }}>API key created</span>
              </div>
              <p style={{ margin: 0, color: colors.text.secondary, fontSize: 13 }}>
                This key is shown only once. Store it securely.
              </p>
            </div>
            <button
              onClick={() => setRevealedKey(null)}
              style={{
                border: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.secondary,
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: colors.background.secondary,
              borderRadius: 10,
              border: `1px dashed ${colors.border.light}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: colors.text.primary, wordBreak: 'break-all' }}>
              {revealedKey}
            </span>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.primary.main,
                color: colors.text.inverse,
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <FiCopy />
              Copy
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: withOpacity(colors.primary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiKey color={colors.primary.main} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: colors.text.primary, fontSize: 16, fontWeight: 600 }}>Create a new key</h3>
            <p style={{ margin: '4px 0 0', color: colors.text.secondary, fontSize: 12 }}>
              Use descriptive names like "Staging dashboard" or "Data warehouse".
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, color: colors.text.secondary }}>Key name</label>
            <input
              value={keyName}
              onChange={(event) => setKeyName(event.target.value)}
              placeholder="e.g. Analytics pipeline"
              style={{
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.tertiary,
                fontSize: 13,
                color: colors.text.primary,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: colors.text.secondary }}>Expiry (defaults to 5 years)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.tertiary,
                fontSize: 13,
                color: colors.text.primary,
              }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            style={{
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: colors.primary.main,
              color: colors.text.inverse,
              fontWeight: 600,
              fontSize: 13,
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.7 : 1,
            }}
          >
            {isCreating ? 'Creating…' : 'Create key'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {[
            { id: 'full', label: 'Full access', helper: 'Read + write' },
            { id: 'read', label: 'Read-only', helper: 'Recommended for analytics' },
            { id: 'custom', label: 'Custom', helper: 'Choose scopes' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAccessMode(option.id as AccessMode)}
              style={{
                border: `1px solid ${accessMode === option.id ? colors.primary.main : colors.border.light}`,
                backgroundColor: accessMode === option.id ? withOpacity(colors.primary.main, 0.08) : colors.background.tertiary,
                color: colors.text.primary,
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {option.label}
              <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: colors.text.secondary }}>
                {option.helper}
              </span>
            </button>
          ))}
        </div>

        {accessMode === 'custom' && (
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {scopeOptions.map((option) => {
              const scopeState = customScopes[option.id] || { read: false, write: false };
              return (
                <div
                  key={option.id}
                  style={{
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: 12,
                    padding: 12,
                    display: 'grid',
                    gridTemplateColumns: '1.5fr auto auto',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.primary }}>{option.label}</div>
                    <div style={{ fontSize: 11, color: colors.text.secondary }}>{option.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleScopeToggle(option.id, 'read')}
                    style={{
                      border: `1px solid ${scopeState.read ? colors.primary.main : colors.border.light}`,
                      backgroundColor: scopeState.read ? withOpacity(colors.primary.main, 0.12) : colors.background.tertiary,
                      color: colors.text.primary,
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Read
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScopeToggle(option.id, 'write')}
                    style={{
                      border: `1px solid ${scopeState.write ? colors.primary.main : colors.border.light}`,
                      backgroundColor: scopeState.write ? withOpacity(colors.primary.main, 0.12) : colors.background.tertiary,
                      color: colors.text.primary,
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Write
                  </button>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: colors.text.secondary }}>
              Selected scopes: {buildScopes().join(', ') || 'None'}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: colors.text.primary, fontSize: 16, fontWeight: 600 }}>Usage overview</h3>
            <p style={{ margin: '4px 0 0', color: colors.text.secondary, fontSize: 12 }}>
              Rolling 7-day usage across all API keys.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              border: `1px solid ${colors.border.light}`,
              backgroundColor: colors.background.tertiary,
              borderRadius: 10,
              padding: '6px 10px',
              fontSize: 12,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              color: colors.text.primary,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            <FiDownload />
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {usageSummary ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${colors.border.light}` }}>
                <div style={{ fontSize: 12, color: colors.text.secondary }}>Requests</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.text.primary }}>{usageSummary.totalRequests}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${colors.border.light}` }}>
                <div style={{ fontSize: 12, color: colors.text.secondary }}>Error rate</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.text.primary }}>{usageSummary.errorRate}%</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${colors.border.light}` }}>
                <div style={{ fontSize: 12, color: colors.text.secondary }}>Top endpoint</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.primary }}>{usageSummary.topEndpoint}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {usageSummary.daily.length === 0 && (
                <p style={{ color: colors.text.secondary, fontSize: 12 }}>No usage recorded yet.</p>
              )}
              {usageSummary.daily.map((day) => (
                <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 90, fontSize: 12, color: colors.text.secondary }}>{day.date}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: colors.background.tertiary }}>
                    <div
                      style={{
                        width: `${Math.min(100, (day.count / Math.max(1, usageSummary.totalRequests)) * 100)}%`,
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: colors.primary.main,
                      }}
                    />
                  </div>
                  <div style={{ width: 40, textAlign: 'right', fontSize: 12, color: colors.text.primary }}>{day.count}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: colors.text.secondary, fontSize: 12 }}>Usage data will appear once requests are made.</p>
        )}
      </div>

      <div
        style={{
          backgroundColor: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, color: colors.text.primary, fontSize: 16, fontWeight: 600 }}>Your keys</h3>
            <p style={{ margin: '4px 0 0', color: colors.text.secondary, fontSize: 12 }}>
              {activeCount} active key{activeCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {isLoading && <p style={{ color: colors.text.secondary }}>Loading keys…</p>}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.status.error, fontSize: 13 }}>
            <FiAlertCircle />
            {error}
          </div>
        )}

        {!isLoading && keys.length === 0 && !error && (
          <p style={{ color: colors.text.secondary, fontSize: 13 }}>No API keys yet.</p>
        )}

        {keys.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {keys.map((record) => {
              const status = getStatusPill(record);
              return (
                <div
                  key={record.id}
                  style={{
                    border: `1px solid ${colors.border.light}`,
                    borderRadius: 12,
                    padding: 14,
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: colors.text.primary, fontSize: 13 }}>
                      {record.name}
                    </div>
                    <div style={{ fontSize: 12, color: colors.text.secondary }}>
                      {record.key_prefix}••••••••••••
                    </div>
                    <div style={{ fontSize: 11, color: colors.text.secondary, marginTop: 4 }}>
                      {getScopeLabel(record.scopes)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: colors.text.secondary }}>
                    Created {formatDate(record.created_at)}
                  </div>
                  <div style={{ fontSize: 12, color: colors.text.secondary }}>
                    Last used {formatDate(record.last_used_at || undefined)}
                  </div>
                  <div style={{ fontSize: 11, color: colors.text.secondary }}>
                    Expires {formatDate(record.expires_at || undefined)}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        borderRadius: 999,
                        backgroundColor: withOpacity(status.color, 0.12),
                        color: status.color,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleRotate(record)}
                      disabled={!record.is_active || isRotating === record.id}
                      style={{
                        border: `1px solid ${colors.border.light}`,
                        backgroundColor: colors.background.tertiary,
                        borderRadius: 10,
                        padding: '6px 10px',
                        fontSize: 12,
                        cursor: !record.is_active ? 'not-allowed' : 'pointer',
                        color: colors.text.primary,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: !record.is_active ? 0.5 : 1,
                      }}
                    >
                      <FiRefreshCw />
                      {isRotating === record.id ? 'Rotating…' : 'Rotate'}
                    </button>
                    <button
                      onClick={() => handleRevoke(record.id)}
                      disabled={!record.is_active || isRevoking === record.id}
                      style={{
                        border: `1px solid ${colors.border.light}`,
                        backgroundColor: colors.background.tertiary,
                        borderRadius: 10,
                        padding: '6px 10px',
                        fontSize: 12,
                        cursor: !record.is_active ? 'not-allowed' : 'pointer',
                        color: colors.status.error,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: !record.is_active ? 0.5 : 1,
                      }}
                    >
                      <FiTrash2 />
                      {isRevoking === record.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 20,
          borderRadius: 16,
          border: `1px solid ${colors.border.light}`,
          backgroundColor: withOpacity(colors.primary.main, 0.05),
          padding: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.primary, marginBottom: 6 }}>
          Security tips
        </div>
        <div style={{ fontSize: 12, color: colors.text.secondary }}>
          Keep keys out of client-side code, rotate regularly, and use separate keys for production and staging.
        </div>
      </div>
    </div>
  );
};

export default DeveloperSettings;
