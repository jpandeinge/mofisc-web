import React from 'react';
import { LegalCallout, LegalList, LegalPageLayout, LegalSection } from '../components/Legal';

const DataPolicy: React.FC = () => {
  const sections = [
    { id: 'information-collected', label: 'Information we collect' },
    { id: 'how-we-use-data', label: 'How we use data' },
    { id: 'lawful-basis', label: 'Lawful basis and controls' },
    { id: 'sharing-and-processors', label: 'Sharing and processors' },
    { id: 'storage-and-retention', label: 'Storage and retention' },
    { id: 'security-and-monitoring', label: 'Security and monitoring' },
    { id: 'your-rights', label: 'Your privacy rights' },
    { id: 'contact-and-updates', label: 'Contact and updates' },
  ];

  return (
    <LegalPageLayout
      title="Data Policy"
      icon="data"
      summary="This policy explains how Mofisc collects, uses, stores, and protects personal and financial information when you use our products and services."
      sections={sections}
      lastUpdated="18 February 2026"
      effectiveDate="18 February 2026"
    >
      <LegalSection id="information-collected" title="1. Information We Collect">
        <p>
          We collect information you provide directly when you create an account, upload statements,
          contact support, or update profile settings.
        </p>
        <LegalList
          items={[
            'Identity data: full name, email address, account identifiers, authentication metadata.',
            'Financial data: transaction records, categories, balances, budgets, goals, and subscription activity.',
            'Technical data: device type, browser metadata, IP-derived security signals, and audit events.',
            'Support data: messages and operational logs required to investigate account issues.',
          ]}
        />
      </LegalSection>

      <LegalSection id="how-we-use-data" title="2. How We Use Your Information">
        <p>
          We process data to deliver core product features, protect your account, and improve service quality.
        </p>
        <LegalList
          items={[
            'Operate account features including transaction processing, analytics, budgets, goals, and alerts.',
            'Secure access through authentication, anomaly detection, and fraud or abuse prevention.',
            'Provide support and service communication, including policy and security notifications.',
            'Measure product reliability and usage trends to improve performance and usability.',
          ]}
        />
      </LegalSection>

      <LegalSection id="lawful-basis" title="3. Lawful Basis and Processing Controls">
        <p>
          Where required by applicable privacy law, we rely on one or more lawful bases for processing:
          performance of contract, legal obligations, legitimate interests, and your consent where applicable.
        </p>
        <LegalCallout title="Consent and marketing">
          You can opt out of non-essential communications at any time from your account preferences or through
          unsubscribe links.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="sharing-and-processors" title="4. Information Sharing and Disclosure">
        <p>
          We do not sell personal data. We share limited information only with vetted processors and service
          providers that support platform operation.
        </p>
        <LegalList
          items={[
            'Infrastructure and hosting providers used for secure product operation.',
            'Authentication, communications, and support tooling providers.',
            'Legal, regulatory, or enforcement authorities where disclosure is legally required.',
          ]}
        />
      </LegalSection>

      <LegalSection id="storage-and-retention" title="5. Data Storage and Retention">
        <p>
          We retain personal and financial data while your account is active and for periods required to
          satisfy legal, accounting, security, and dispute obligations.
        </p>
        <LegalCallout title="Deletion requests">
          When you request account deletion, we remove or anonymize personal data except where retention is
          required by law or necessary for security and fraud-prevention records.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="security-and-monitoring" title="6. Security and Monitoring">
        <p>
          We apply reasonable technical and organizational safeguards, including
          access controls, encryption in transit, key handling controls, and operational monitoring.
        </p>
        <LegalList
          items={[
            'Role-based access control and least-privilege service permissions.',
            'Security monitoring for suspicious login, device, and usage events.',
            'Audit logging and incident-response processes for production environments.',
          ]}
        />
      </LegalSection>

      <LegalSection id="your-rights" title="7. Your Privacy Rights">
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, export, restrict, or delete
          your personal information, and to object to specific processing activities.
        </p>
        <p>
          You can submit requests through support channels. We may require identity verification before completing
          sensitive requests.
        </p>
      </LegalSection>

      <LegalSection id="contact-and-updates" title="8. Contact and Policy Updates">
        <p>
          We may update this policy to reflect product, legal, or regulatory changes. Material updates will be
          communicated in-app, by email, or both.
        </p>
        <p>
          For privacy questions, contact <a href="mailto:support@mofisc.com">support@mofisc.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default DataPolicy;
