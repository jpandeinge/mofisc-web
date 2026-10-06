import { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingAnchorLink from './LandingAnchorLink';

const navLinks = [
  { name: 'Product', anchor: 'features' },
  { name: 'How it works', anchor: 'how-it-works' },
  { name: 'Security', anchor: 'security' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="absolute left-0 right-0 top-0 z-50 border-b border-[#dfe5ec] bg-[#f8fafc] px-4 sm:px-6">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Mofisc home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#246bfd] text-sm font-semibold text-white">M</span>
          <span className="text-lg font-semibold tracking-[-0.02em] text-[#15263c]">Mofisc</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <LandingAnchorLink key={link.name} anchor={link.anchor} className="text-sm text-[#5f6f82] hover:text-[#15263c]">
              {link.name}
            </LandingAnchorLink>
          ))}
          <Link to="/pricing" className="text-sm text-[#5f6f82] hover:text-[#15263c]">Pricing</Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link to="/signin" className="text-sm font-medium text-[#15263c]">Sign in</Link>
          <Link to="/signup" className="rounded-lg bg-[#15263c] px-4 py-2 text-sm font-medium text-white hover:bg-[#246bfd]">Get started</Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="bg-transparent px-2 py-2 text-sm font-medium text-[#15263c] hover:bg-transparent md:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {isOpen ? (
        <div className="mx-auto max-w-[1120px] border-t border-[#dfe5ec] bg-[#f8fafc] py-3 md:hidden">
          {navLinks.map((link) => (
            <LandingAnchorLink
              key={link.name}
              anchor={link.anchor}
              className="block px-2 py-2.5 text-sm text-[#5f6f82]"
              onNavigate={() => setIsOpen(false)}
            >
              {link.name}
            </LandingAnchorLink>
          ))}
          <Link to="/pricing" className="block px-2 py-2.5 text-sm text-[#5f6f82]" onClick={() => setIsOpen(false)}>Pricing</Link>
          <div className="mt-2 flex gap-3 border-t border-[#dfe5ec] px-2 pt-4">
            <Link to="/signin" onClick={() => setIsOpen(false)} className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#cfd7e2] text-sm font-medium text-[#15263c]">Sign in</Link>
            <Link to="/signup" onClick={() => setIsOpen(false)} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#15263c] text-sm font-medium text-white">Get started</Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
