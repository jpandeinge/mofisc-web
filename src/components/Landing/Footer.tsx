import { Link } from 'react-router-dom';
import { FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import LandingAnchorLink from './LandingAnchorLink';

const footerLinks = {
  Product: [
    ['Overview', '/#features'],
    ['How it works', '/#how-it-works'],
    ['Security', '/#security'],
    ['Pricing', '/pricing'],
  ],
  Company: [
    ['About', '/about'],
    ['Contact', 'mailto:support@mofisc.com'],
    ['Sign in', '/signin'],
  ],
  Resources: [
    ['Questions', '/#faq'],
    ['API reference', '/api-reference'],
    ['Supported banks', '/#supported-banks'],
  ],
  Legal: [
    ['Data policy', '/data-policy'],
    ['Terms of service', '/terms'],
    ['Cookie policy', '/cookie-policy'],
  ],
};

const FooterLink = ({ href, label }: { href: string; label: string }) => {
  const className = 'text-sm text-[#68778a] hover:text-[#15263c]';
  if (href.startsWith('/#')) {
    return <LandingAnchorLink anchor={href.slice(2)} className={className}>{label}</LandingAnchorLink>;
  }

  return href.startsWith('/') ? <Link to={href} className={className}>{label}</Link> : <a href={href} className={className}>{label}</a>;
};

const Footer = () => (
  <footer className="border-t border-[#dfe5ec] bg-[#f4f6f8] px-4 py-12 sm:px-6 sm:py-14">
    <div className="mx-auto max-w-[1120px]">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2" aria-label="Mofisc home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#246bfd] text-sm font-semibold text-white">M</span>
            <span className="text-lg font-semibold text-[#15263c]">Mofisc</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#68778a]">Financial information organised in one clear place.</p>
          <div className="mt-5 flex gap-2">
            <a
              href="https://x.com/mofisc"
              target="_blank"
              rel="noreferrer"
              aria-label="Mofisc on X"
              title="Mofisc on X"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d2d9e2] text-[#526174] transition-colors hover:border-[#aeb9c6] hover:bg-white hover:text-[#15263c]"
            >
              <FaXTwitter className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <a
              href="https://linkedin.com/company/mofisc"
              target="_blank"
              rel="noreferrer"
              aria-label="Mofisc on LinkedIn"
              title="Mofisc on LinkedIn"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d2d9e2] text-[#526174] transition-colors hover:border-[#aeb9c6] hover:bg-white hover:text-[#15263c]"
            >
              <FaLinkedinIn className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-[#15263c]">{category}</h3>
            <ul className="mt-4 space-y-3">
              {links.map(([label, href]) => <li key={label}><FooterLink label={label} href={href} /></li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-[#d7dee7] pt-6 text-xs text-[#738194] sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Mofisc. All rights reserved.</p>
        <p>Namibia</p>
      </div>
    </div>
  </footer>
);

export default Footer;
