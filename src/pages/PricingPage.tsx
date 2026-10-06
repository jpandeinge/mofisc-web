import { Link } from 'react-router-dom';
import PublicPageShell from '../components/Landing/PublicPageShell';
import PricingCards from '../components/Pricing/PricingCards';
import PricingComparison from '../components/Pricing/PricingComparison';

const faqs = [
  ['Can I switch plans?', 'Yes. You can change your plan from account settings.'],
  ['Is there a free trial?', 'Paid plans include a seven day trial.'],
  ['What payment methods are accepted?', 'Major credit and debit cards are accepted through the checkout provider.'],
  ['Can I cancel?', 'Yes. A subscription can be cancelled from account settings.'],
];

const PricingPage = () => (
  <PublicPageShell>
    <section className="border-b border-[#dfe5ec] bg-white px-4 py-16 text-center sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">Pricing</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#15263c] sm:text-5xl">Choose the plan that fits your use.</h1>
        <p className="mt-5 text-base leading-7 text-[#5f6f82]">Start with the free plan. Paid plans add higher limits, more accounts and deeper analysis.</p>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <PricingCards />
        <div className="mt-20"><PricingComparison /></div>
      </div>
    </section>

    <section className="border-t border-[#dfe5ec] bg-white px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[920px]">
        <h2 className="text-2xl font-semibold text-[#15263c]">Pricing questions</h2>
        <div className="mt-7 grid gap-x-10 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <div key={question} className="border-t border-[#dfe5ec] py-5">
              <h3 className="text-sm font-semibold text-[#15263c]">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5f6f82]">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-[920px] flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-[#15263c]">Ready to try Mofisc?</h2>
        </div>
        <Link to="/signup" className="flex h-11 items-center justify-center rounded-lg bg-[#15263c] px-5 text-sm font-medium text-white">Create an account</Link>
      </div>
    </section>
  </PublicPageShell>
);

export default PricingPage;
