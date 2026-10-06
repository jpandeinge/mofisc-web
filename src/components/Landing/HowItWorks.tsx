const steps = [
  ['Add your information', 'Connect a supported account or upload a statement. Mofisc receives view only information.'],
  ['Review the organised data', 'Transactions are grouped and recurring payments are identified. You can make corrections.'],
  ['Use the information', 'Review spending, create a budget and follow progress towards your goals.'],
];

const HowItWorks = () => (
  <section id="how-it-works" className="px-4 py-20 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-[1120px]">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">How it works</p>
      <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-[#15263c] sm:text-4xl">A straightforward way to understand your finances.</h2>

      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map(([title, description], index) => (
          <li key={title} className="border-t border-[#aeb9c6] pt-5">
            <p className="text-xs text-[#8591a0]">Step {index + 1}</p>
            <h3 className="mt-4 text-lg font-semibold text-[#15263c]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#5f6f82]">{description}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default HowItWorks;
