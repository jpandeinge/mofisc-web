import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Landing/Navbar';
import Hero from '../components/Landing/Hero';
import SupportedBanks from '../components/Landing/SupportedBanks';
import Features from '../components/Landing/Features';
import Security from '../components/Landing/Security';
import HowItWorks from '../components/Landing/HowItWorks';
import FAQ from '../components/Landing/FAQ';
import CTA from '../components/Landing/CTA';
import Footer from '../components/Landing/Footer';

const LandingPage = () => {
  const { hash } = useLocation();
  const siteUrl = 'https://mofisc.com';
  const siteName = 'Mofisc';
  const pageTitle = 'Mofisc | Personal Finance in One Place';
  const pageDescription =
    'Mofisc helps you organise transactions, understand spending, manage subscriptions and follow your financial goals.';
  const ogImageUrl = `${siteUrl}/og-image.png`;

  useEffect(() => {
    if (!hash) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NAD',
      description: 'Seven day trial',
    },
    description: pageDescription,
    url: siteUrl,
    screenshot: ogImageUrl,
    featureList: [
      'Transaction tracking',
      'Automated expense categorisation',
      'Subscription management and reminders',
      'Personalised savings goals',
      'Multiple account overview',
      'Export and reporting tools',
    ],
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://twitter.com/mofisc',
      'https://linkedin.com/company/mofisc',
      'https://facebook.com/mofisc',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@mofisc.com',
    },
  };

  // FAQ Schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does Mofisc connect to my bank account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Add information through a supported account connection or by uploading a statement. You choose which accounts and documents to include.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my financial data secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mofisc uses encryption in transit and at rest, secure authentication, and view only financial data access.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which Namibian banks are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We currently support FNB Namibia, Standard Bank, Nedbank, and Bank Windhoek.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does Mofisc cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Paid Mofisc plans include a seven day trial and are available monthly or annually.',
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="financial management, budgeting, expense tracking, savings, money management, personal finance, banking, transactions, Namibia finance, subscription management, financial insights, FNB, Standard Bank, Nedbank, Bank Windhoek"
        />
        <link rel="canonical" href={siteUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:site" content="@mofisc" />
        <meta name="twitter:creator" content="@mofisc" />

        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="Mofisc Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

        {/* Mobile App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="application-name" content={siteName} />
        <meta name="theme-color" content="#15263c" />
        <meta name="msapplication-TileColor" content="#15263c" />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(organizationData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.REACT_APP_API_URL} />
      </Helmet>

      <div className="landing-page min-h-screen bg-[#f7f9fc] text-[#10243e]">
        <Navbar />
        <main>
          <Hero />
          <SupportedBanks />
          <Features />
          <Security />
          <HowItWorks />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
