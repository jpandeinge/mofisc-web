import { Link } from 'react-router-dom';
import PublicPageShell from '../components/Landing/PublicPageShell';

const principles = [
  ['Clarity', 'Financial tools should explain information in plain language and make the next decision easier.'],
  ['Privacy', 'People should understand how their information is used and remain in control of it.'],
  ['Practical value', 'A useful financial product should support everyday decisions, not only produce more reports.'],
];

const AboutPage = () => (
  <PublicPageShell>
    <section className="border-b border-[#dfe5ec] bg-white px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[960px]">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">About Mofisc</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-[#15263c] sm:text-5xl">Helping people understand their finances.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f6f82]">Mofisc is a personal finance platform for organising transactions, reviewing spending and planning towards financial goals.</p>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[960px]">
        <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr]">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#15263c]">Why we are building Mofisc</h2>
          <div className="space-y-5 text-base leading-7 text-[#5f6f82]">
            <p>Financial information is often spread across statements, banking applications and spreadsheets. That makes it difficult to understand what has changed and what to do next.</p>
            <p>Mofisc brings that information together and presents it in a consistent format. The aim is to help people make informed decisions without needing specialist financial knowledge.</p>
          </div>
        </div>

        <div className="mt-16 border-y border-[#dfe5ec]">
          {principles.map(([title, description]) => (
            <div key={title} className="grid gap-3 border-b border-[#dfe5ec] py-6 last:border-b-0 md:grid-cols-[200px_1fr]">
              <h3 className="text-base font-semibold text-[#15263c]">{title}</h3>
              <p className="text-sm leading-6 text-[#5f6f82]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-[#dfe5ec] bg-white px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-[960px] gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#15263c]">For financial institutions</h2>
        <div>
          <p className="text-base leading-7 text-[#5f6f82]">Mofisc also provides API access and integration options for organisations that need structured financial information in their own products.</p>
          <Link to="/api-reference" className="mt-5 inline-block text-sm font-medium text-[#245dc7] underline underline-offset-4">View the API reference</Link>
        </div>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-[960px] flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-[#15263c]">See Mofisc for yourself.</h2>
          <p className="mt-2 text-sm text-[#5f6f82]">Create an account and explore the product for seven days.</p>
        </div>
        <Link to="/signup" className="flex h-11 items-center justify-center rounded-lg bg-[#15263c] px-5 text-sm font-medium text-white">Create an account</Link>
      </div>
    </section>
  </PublicPageShell>
);

export default AboutPage;
