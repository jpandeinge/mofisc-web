import { Link } from 'react-router-dom';

const CTA = () => (
  <section className="bg-white px-4 py-16 sm:px-6 sm:py-20">
    <div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-7 border border-[#d7dee7] bg-[#f4f7fa] p-7 sm:p-10 md:flex-row md:items-center">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#15263c] sm:text-3xl">Start with a clearer financial picture.</h2>
      </div>
      <Link to="/signup" className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#15263c] px-5 text-sm font-medium text-white hover:bg-[#246bfd]">Create an account</Link>
    </div>
  </section>
);

export default CTA;
