import type { MouseEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LandingAnchorLinkProps {
  anchor: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}

const LandingAnchorLink = ({ anchor, children, className, onNavigate }: LandingAnchorLinkProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const destination = `/#${anchor}`;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();

    const isModifiedClick = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
    if (event.button !== 0 || isModifiedClick || location.pathname !== '/') return;

    event.preventDefault();
    navigate(destination);

    window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
    });
  };

  return (
    <Link to={destination} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default LandingAnchorLink;
