import React from 'react';
import { LegalCallout, LegalList, LegalPageLayout, LegalSection } from '../components/Legal';

const CookiePolicy: React.FC = () => {
  const sections = [
    { id: 'what-are-cookies', label: 'What cookies are' },
    { id: 'how-we-use-cookies', label: 'How we use cookies' },
    { id: 'cookie-categories', label: 'Cookie categories' },
    { id: 'third-party-cookies', label: 'Third-party cookies' },
    { id: 'your-choices', label: 'Your choices' },
    { id: 'dnt-and-updates', label: 'Do Not Track and updates' },
  ];

  return (
    <LegalPageLayout
      title="Cookie Policy"
      icon="cookie"
      summary="This policy explains how Mofisc uses cookies and similar technologies to keep sessions secure, remember preferences, and measure product reliability."
      sections={sections}
      lastUpdated="18 February 2026"
      effectiveDate="18 February 2026"
    >
      <LegalSection id="what-are-cookies" title="1. What Cookies Are">
        <p>
          Cookies are small data files stored by your browser. They help keep you signed in, remember
          your settings, and improve product reliability and performance.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use-cookies" title="2. How We Use Cookies">
        <p>We use cookies and similar technologies for core platform operation, including:</p>
        <LegalList
          items={[
            'Authentication and session continuity.',
            'Security checks and abuse prevention.',
            'Preferences, UX settings, and feature behavior.',
            'Performance and reliability analytics.',
          ]}
        />
      </LegalSection>

      <LegalSection id="cookie-categories" title="3. Categories of Cookies">
        <p>
          Some cookies are essential and required for sign-in and account security. Others are used for
          functional preferences or analytics. Session cookies expire when you close your browser, while
          persistent cookies remain for a defined period unless you remove them.
        </p>
      </LegalSection>

      <LegalSection id="third-party-cookies" title="4. Third-Party Cookies">
        <p>
          We may use selected third-party service providers (for example authentication, analytics, or
          infrastructure tooling) that set or read cookies required for service delivery.
        </p>
        <LegalCallout title="No sale of personal data">
          We do not sell personal data collected via cookies.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="your-choices" title="5. Your Choices">
        <p>
          Most browsers accept cookies by default. You can manage cookies through browser settings,
          including deletion or blocking. If you disable essential cookies, parts of Mofisc may not
          function correctly.
        </p>
      </LegalSection>

      <LegalSection id="dnt-and-updates" title="6. Do Not Track and Policy Updates">
        <p>
          Some browsers provide "Do Not Track" (DNT) signals. Because there is no consistent standard
          for DNT interpretation, our services may not respond uniformly to those signals.
        </p>
        <p>
          We may update this policy periodically. Material updates are announced in-app, by email, or both.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default CookiePolicy;
