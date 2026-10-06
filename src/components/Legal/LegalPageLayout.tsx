import { ReactNode, useMemo } from 'react';
import PublicPageShell from '../Landing/PublicPageShell';

interface LegalPageLayoutProps {
  title: string;
  icon: 'terms' | 'data' | 'cookie';
  summary?: string;
  sections?: Array<{ id: string; label: string }>;
  lastUpdated?: string;
  effectiveDate?: string;
  children: ReactNode;
}

const toAnchorId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

const LegalPageLayout = ({ title, summary, sections = [], lastUpdated, effectiveDate, children }: LegalPageLayoutProps) => {
  const fallbackDate = useMemo(() => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), []);
  const updatedDate = lastUpdated || fallbackDate;
  const activeDate = effectiveDate || updatedDate;

  return (
    <PublicPageShell>
      <section className="border-b border-[#dfe5ec] bg-white px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[960px]">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">Legal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[#15263c]">{title}</h1>
          {summary ? <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f6f82]">{summary}</p> : null}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#738194]">
            <span>Last updated: {updatedDate}</span>
            <span>Effective: {activeDate}</span>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-[960px] gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#738194]">On this page</p>
            <nav className="mt-4 space-y-2">
              {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block text-sm text-[#5f6f82] hover:text-[#15263c]">{section.label}</a>)}
            </nav>
            <p className="mt-7 border-t border-[#dfe5ec] pt-5 text-xs leading-5 text-[#738194]">Questions can be sent to <a href="mailto:support@mofisc.com" className="text-[#245dc7]">support@mofisc.com</a>.</p>
          </aside>
          <article className="min-w-0">{children}</article>
        </div>
      </section>
    </PublicPageShell>
  );
};

export default LegalPageLayout;

export const LegalSection = ({ id, title, children }: { id?: string; title: string; children: ReactNode }) => (
  <section id={id || toAnchorId(title)} className="mb-10 scroll-mt-24 last:mb-0">
    <h2 className="text-xl font-semibold text-[#15263c]">{title}</h2>
    <div className="mt-3 text-sm leading-7 text-[#5f6f82]">{children}</div>
  </section>
);

export const LegalList = ({ items }: { items: string[] }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5">
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

export const LegalCallout = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mt-4 border-l-2 border-[#246bfd] bg-[#f3f6fa] p-4">
    <h3 className="text-sm font-semibold text-[#15263c]">{title}</h3>
    <div className="mt-1 text-sm leading-6 text-[#5f6f82]">{children}</div>
  </div>
);
