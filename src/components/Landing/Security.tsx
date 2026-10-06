import { Link } from 'react-router-dom';

const principles = [
  ['Account permissions', 'You remain in control of the accounts and information connected to Mofisc.'],
  ['Protected information', 'Financial information is encrypted while it is transferred and while it is stored.'],
  ['Controlled account access', 'Authentication and device checks help protect access to your account.'],
];

const Security = () => (
  <section id="security" className="border-y border-[#dfe5ec] bg-white px-4 py-20 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-[1120px]">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">Security</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15263c] sm:text-4xl">Your information stays protected.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#5f6f82]">Mofisc limits access to the information required to provide the service. Your financial information is not sold.</p>
          <Link to="/data-policy" className="mt-6 inline-block text-sm font-medium text-[#245dc7] underline underline-offset-4">Read the data policy</Link>
        </div>

        <div className="border-t border-[#dfe5ec]">
          {principles.map(([title, description]) => (
            <div key={title} className="grid gap-2 border-b border-[#dfe5ec] py-6 sm:grid-cols-[190px_1fr] sm:gap-6">
              <h3 className="text-sm font-semibold text-[#15263c]">{title}</h3>
              <p className="text-sm leading-6 text-[#5f6f82]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Security;
