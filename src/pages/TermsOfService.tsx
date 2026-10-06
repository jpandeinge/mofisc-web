import React from 'react';
import { LegalCallout, LegalList, LegalPageLayout, LegalSection } from '../components/Legal';

const TermsOfService: React.FC = () => {
  const sections = [
    { id: 'acceptance', label: 'Acceptance of terms' },
    { id: 'service-scope', label: 'Service scope' },
    { id: 'account-security', label: 'Account and security' },
    { id: 'billing-and-plans', label: 'Billing and plans' },
    { id: 'acceptable-use', label: 'Acceptable use' },
    { id: 'intellectual-property', label: 'Intellectual property' },
    { id: 'termination', label: 'Termination' },
    { id: 'disclaimers-liability', label: 'Disclaimers and liability' },
    { id: 'governing-law', label: 'Governing law' },
    { id: 'updates-and-contact', label: 'Updates and contact' },
  ];

  return (
    <LegalPageLayout
      title="Terms of Service"
      icon="terms"
      summary="These terms govern your use of Mofisc products and services. By creating an account or using the platform, you agree to these terms."
      sections={sections}
      lastUpdated="18 February 2026"
      effectiveDate="18 February 2026"
    >
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>
          By accessing or using Mofisc, you agree to these Terms of Service and applicable laws and
          regulations. If you do not agree, do not use the platform.
        </p>
      </LegalSection>

      <LegalSection id="service-scope" title="2. Service Scope">
        <p>
          Mofisc provides personal and business financial management features, including statement
          ingestion, categorization, planning, and analytics tools.
        </p>
        <LegalCallout title="No financial advice">
          Mofisc provides software tools and informational outputs. Nothing in the service constitutes
          financial, investment, tax, legal, or accounting advice.
        </LegalCallout>
        <LegalCallout title="Service changes">
          We may update, improve, or deprecate features over time to maintain platform reliability,
          compliance, and security.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="account-security" title="3. Account and Security Responsibilities">
        <p>
          You are responsible for account confidentiality, safeguarding credentials, and all activity
          under your account.
        </p>
        <LegalList
          items={[
            'Use accurate account information and maintain current contact details.',
            'Notify us promptly of unauthorized access or suspicious activity.',
            'Do not share credentials or API keys with unauthorized users.',
          ]}
        />
      </LegalSection>

      <LegalSection id="billing-and-plans" title="4. Billing, Plans, and Usage Limits">
        <p>
          Paid plans may include recurring billing and usage-based limits. You are responsible for
          applicable taxes and fees associated with your selected plan.
        </p>
        <p>
          If payment fails or a subscription expires, certain features may be restricted until payment
          is resolved.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="5. Acceptable Use">
        <p>
          You must not use the platform to perform unlawful activities, abuse service capacity, attempt
          unauthorized access, or interfere with other users or infrastructure.
        </p>
        <LegalList
          items={[
            'No reverse engineering, credential abuse, scraping abuse, or integrity attacks.',
            'No use of automated systems to overwhelm endpoints or bypass rate limits.',
            'No misuse of financial data belonging to other users or organizations.',
          ]}
        />
      </LegalSection>

      <LegalSection id="intellectual-property" title="6. Intellectual Property">
        <p>
          The platform, software, designs, and associated content are owned by Mofisc or its licensors
          and are protected by applicable intellectual property laws.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="7. Suspension and Termination">
        <p>
          We may suspend or terminate access where required for security, compliance, abuse prevention,
          payment delinquency, or material breach of these terms.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers-liability" title="8. Disclaimers and Limitation of Liability">
        <p>
          The service is provided on an "as is" and "as available" basis to the maximum extent permitted
          by law. Mofisc is not liable for indirect, incidental, special, consequential, or punitive damages
          arising from use of the platform.
        </p>
        <p>
          Nothing in these terms excludes liability where exclusion is not legally permitted.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="9. Governing Law and Disputes">
        <p>
          These terms are governed by the laws of the jurisdiction where the Mofisc contracting entity
          is organized, excluding conflict-of-law rules, unless mandatory local law requires otherwise.
        </p>
      </LegalSection>

      <LegalSection id="updates-and-contact" title="10. Updates and Contact">
        <p>
          We may update these terms periodically. Material updates are announced through product notices,
          email, or both. Continued use after updates means you accept the revised terms.
        </p>
        <p>
          Contact legal and support at <a href="mailto:support@mofisc.com">support@mofisc.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default TermsOfService;
