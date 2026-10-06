const features = [
  {
    title: 'Understand your spending',
    description: 'See income, expenses and categories together. Correct a category when needed and keep your records useful.',
    detail: 'Transactions are organised by category and date.',
  },
  {
    title: 'Keep track of subscriptions',
    description: 'Review recurring payments and upcoming renewal dates in one list. This makes regular costs easier to manage.',
    detail: 'Upcoming charges are shown before their renewal date.',
  },
  {
    title: 'Plan with real numbers',
    description: 'Create a budget or savings goal based on your actual cash flow and follow your progress over time.',
    detail: 'Goals update as new financial information is added.',
  },
];

const Features = () => (
  <section id="features" className="px-4 py-20 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-[1120px]">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">Product</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15263c] sm:text-4xl">The information you need, in one place.</h2>
        <p className="mt-4 text-base leading-7 text-[#5f6f82]">Mofisc gives structure to everyday financial information without making it more complicated.</p>
      </div>

      <div className="mt-12 grid border-y border-[#dfe5ec] md:grid-cols-3">
        {features.map((feature, index) => (
          <article key={feature.title} className={`py-7 md:px-7 ${index > 0 ? 'border-t border-[#dfe5ec] md:border-l md:border-t-0' : ''}`}>
            <p className="text-xs text-[#8591a0]">0{index + 1}</p>
            <h3 className="mt-5 text-lg font-semibold text-[#15263c]">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#5f6f82]">{feature.description}</p>
            <p className="mt-6 border-t border-[#e4e9ef] pt-4 text-xs leading-5 text-[#738194]">{feature.detail}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
