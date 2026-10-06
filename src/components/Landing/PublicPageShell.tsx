import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface PublicPageShellProps {
  children: ReactNode;
}

const PublicPageShell = ({ children }: PublicPageShellProps) => (
  <div className="public-page min-h-screen">
    <Navbar />
    <main className="pt-16">{children}</main>
    <Footer />
  </div>
);

export default PublicPageShell;
