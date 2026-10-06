import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import PublicPageShell from '../components/Landing/PublicPageShell';

const scopes = [
  ['Transactions', 'transactions:read, transactions:write'],
  ['Budgets', 'budgets:read, budgets:write'],
  ['Goals', 'goals:read, goals:write'],
  ['Subscriptions', 'subscriptions:read, subscriptions:write'],
  ['Metrics', 'metrics:read'],
  ['Notifications', 'notifications:read'],
  ['Users', 'users:read, users:write'],
];

const endpointGroups = [
  ['Transactions and uploads', 'Upload statements, retrieve transactions and recalculate metrics.', ['POST /upload-statement', 'GET /transactions', 'POST /recalculate-metrics']],
  ['Budgets and goals', 'Create budgets, review their status and manage savings goals.', ['GET /budgets', 'GET /budgets/status', 'GET /goals']],
  ['Subscriptions', 'List subscriptions and manage recurring payments.', ['GET /subscriptions', 'PATCH /subscriptions/{id}/pause', 'PATCH /subscriptions/{id}/resume']],
  ['Metrics', 'Retrieve financial metrics for reports and applications.', ['GET /metrics', 'GET /metrics/financial']],
];

const CodeBlock = ({ title, code }: { title: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden border border-[#d7dee7] bg-white">
      <div className="flex items-center justify-between border-b border-[#d7dee7] px-4 py-3">
        <span className="text-xs font-medium text-[#15263c]">{title}</span>
        <button type="button" onClick={handleCopy} className="bg-transparent text-xs text-[#245dc7] hover:bg-transparent">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="overflow-x-auto bg-[#f6f8fa] p-4 text-xs leading-6 text-[#26384d]">{code}</pre>
    </div>
  );
};

const ApiReferencePage = () => (
  <>
    <Helmet>
      <title>Mofisc API Reference</title>
      <meta name="description" content="Mofisc API reference for transactions, budgets, subscriptions, goals and metrics." />
    </Helmet>

    <PublicPageShell>
      <section className="border-b border-[#dfe5ec] bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">API reference</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[#15263c] sm:text-5xl">Build with Mofisc financial data.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f6f82]">Use versioned endpoints for transactions, budgets, subscriptions, goals and financial metrics.</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ['1. Create a key', 'Generate an API key in Settings under Developer. The complete key is shown once.'],
              ['2. Add the header', 'Send the key in the X-API-Key header with each request.'],
              ['3. Read the response', 'Endpoints return JSON with data or an error message.'],
            ].map(([title, description]) => (
              <div key={title} className="border-t border-[#aeb9c6] pt-5">
                <h2 className="text-base font-semibold text-[#15263c]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5f6f82]">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-[#15263c]">Authentication</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f6f82]">Store API keys on a secure server. Do not include them in browser code or public repositories. Keys can be rotated from account settings.</p>
            </div>
            <CodeBlock title="Request example" code={'curl https://api.mofisc.com/api/v1/metrics\n  -H "X-API-Key: mofisc_live_your_key_here"'} />
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-[#15263c]">Base URL and headers</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f6f82]">All endpoints use the versioned base URL. JSON requests also require the content type header.</p>
            </div>
            <CodeBlock title="Configuration" code={'Base URL: https://api.mofisc.com/api/v1\nX-API-Key: mofisc_live_your_key_here\nContent-Type: application/json'} />
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe5ec] bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="text-2xl font-semibold text-[#15263c]">Available scopes</h2>
          <div className="mt-7 border-t border-[#dfe5ec]">
            {scopes.map(([label, value]) => (
              <div key={label} className="grid gap-2 border-b border-[#dfe5ec] py-4 sm:grid-cols-[180px_1fr]">
                <span className="text-sm font-medium text-[#15263c]">{label}</span>
                <code className="text-xs text-[#5f6f82]">{value}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="text-2xl font-semibold text-[#15263c]">Core endpoints</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {endpointGroups.map(([title, description, endpoints]) => (
              <article key={title as string} className="border-t border-[#aeb9c6] pt-5">
                <h3 className="text-base font-semibold text-[#15263c]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f6f82]">{description}</p>
                <div className="mt-4 space-y-2">
                  {(endpoints as string[]).map((endpoint) => <code key={endpoint} className="block text-xs text-[#26384d]">{endpoint}</code>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#dfe5ec] bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[960px]">
          <h2 className="text-2xl font-semibold text-[#15263c]">Examples</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <CodeBlock title="List transactions" code={'curl "https://api.mofisc.com/api/v1/transactions?skip=0&limit=50"\n  -H "X-API-Key: mofisc_live_your_key_here"'} />
            <CodeBlock title="Upload a statement" code={'curl -X POST https://api.mofisc.com/api/v1/upload-statement/\n  -H "X-API-Key: mofisc_live_your_key_here"\n  -F "file=@statement.pdf"'} />
          </div>
        </div>
      </section>
    </PublicPageShell>
  </>
);

export default ApiReferencePage;
