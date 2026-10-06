type Feature = {
  name: string;
  free: string | boolean;
  basic: string | boolean;
  premium: string | boolean;
  enterprise: string | boolean;
};

const features: Feature[] = [
  { name: 'Transaction categorisation', free: 'Basic', basic: 'Advanced', premium: 'Automatic', enterprise: 'Custom' },
  { name: 'Monthly transactions', free: '100', basic: '300', premium: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Bank accounts', free: '1', basic: 'Multiple', premium: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Financial health analysis', free: 'Basic', basic: 'Detailed', premium: 'Advanced', enterprise: 'Advanced' },
  { name: 'Transaction analysis', free: false, basic: 'Basic', premium: 'Full', enterprise: 'Custom' },
  { name: 'Custom categories', free: false, basic: false, premium: true, enterprise: true },
  { name: 'Custom model configuration', free: false, basic: false, premium: false, enterprise: true },
  { name: 'API access', free: false, basic: false, premium: false, enterprise: true },
  { name: 'Priority support', free: false, basic: false, premium: true, enterprise: true },
];

const plans = [
  ['free', 'Free'],
  ['basic', 'Basic'],
  ['premium', 'Premium'],
  ['enterprise', 'Enterprise'],
] as const;

const PricingComparison = () => (
  <section>
    <div className="mb-7">
      <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#15263c]">Compare plans</h2>
      <p className="mt-2 text-sm text-[#5f6f82]">A complete view of the limits and features included with each plan.</p>
    </div>

    <div className="overflow-x-auto border border-[#d7dee7] bg-white">
      <table className="min-w-[760px] w-full">
        <thead>
          <tr className="border-b border-[#d7dee7] bg-[#f7f9fb]">
            <th className="px-5 py-4 text-left text-sm font-semibold text-[#15263c]">Feature</th>
            {plans.map(([, label]) => <th key={label} className="px-5 py-4 text-center text-sm font-semibold text-[#15263c]">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-b border-[#e4e9ef] last:border-b-0">
              <td className="px-5 py-4 text-sm font-medium text-[#15263c]">{feature.name}</td>
              {plans.map(([key]) => {
                const value = feature[key];
                return <td key={key} className="px-5 py-4 text-center text-sm text-[#5f6f82]">{typeof value === 'boolean' ? (value ? 'Included' : 'Not included') : value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default PricingComparison;
