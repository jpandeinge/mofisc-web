const banks = [
  { name: 'FNB Namibia', logo: '/images/banks/fnb.png' },
  { name: 'Standard Bank', logo: '/images/banks/standard_bank.png' },
  { name: 'Nedbank', logo: '/images/banks/nedbank.png' },
  { name: 'Bank Windhoek', logo: '/images/banks/bank_windhoek.png' },
];

const loopBanks = [...banks, ...banks];

const BankSet = ({ duplicate = false }: { duplicate?: boolean }) => (
  <div className="bank-marquee-set" aria-hidden={duplicate || undefined}>
    {loopBanks.map((bank, index) => {
      const isRepeatedLogo = duplicate || index >= banks.length;

      return (
        <div
          key={`${duplicate ? 'duplicate' : 'primary'}-${bank.name}-${index}`}
          className="group flex h-9 w-36 shrink-0 items-center justify-center sm:w-40"
          aria-hidden={isRepeatedLogo || undefined}
        >
          <img
            src={bank.logo}
            alt={isRepeatedLogo ? '' : bank.name}
            className="max-h-7 w-auto max-w-[122px] object-contain grayscale opacity-60 transition duration-300 group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:opacity-100"
            loading="lazy"
          />
        </div>
      );
    })}
  </div>
);

const SupportedBanks = () => (
  <section id="supported-banks" className="border-y border-[#dfe5ec] bg-white py-8">
    <div className="mx-auto max-w-[1000px]">
      <p className="px-4 text-center text-xs font-medium uppercase tracking-[0.12em] text-[#738194] sm:px-6">
        Supported banks
      </p>

      <div className="bank-marquee mt-6" aria-label="Supported banks">
        <div className="bank-marquee-track">
          <BankSet />
          <BankSet duplicate />
        </div>
      </div>
    </div>
  </section>
);

export default SupportedBanks;
