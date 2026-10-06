import { useState } from 'react';
import { Link } from 'react-router-dom';
import LiveDashboardPreview from './LiveDashboardPreview';
import DemoVideoModal from './DemoVideoModal';

const Hero = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <section className="px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-36">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.045em] text-[#15263c] sm:text-5xl">
            A clear view of your money.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#5f6f82]">
            Mofisc organises your transactions, spending, subscriptions and goals in one place so you can make informed decisions.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="flex h-11 items-center justify-center rounded-lg bg-[#15263c] px-5 text-sm font-medium text-white hover:bg-[#246bfd]">
              Create an account
            </Link>
            <button
              type="button"
              className="h-11 rounded-lg border border-[#cfd7e2] bg-white px-5 text-sm font-medium text-[#15263c] hover:bg-[#f3f6f9]"
              onClick={() => setIsDemoModalOpen(true)}
            >
              View the demo
            </button>
          </div>
        </div>

        <div className="mt-12">
          <LiveDashboardPreview />
        </div>
      </div>

      <DemoVideoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </section>
  );
};

export default Hero;
