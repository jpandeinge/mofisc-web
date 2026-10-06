import { useState } from 'react';

const faqs = [
  ['How does Mofisc access my financial information?', 'Add information through a supported account connection or by uploading a statement. You choose which accounts and documents to include.'],
  ['Which Namibian banks are supported?', 'Mofisc currently supports statements from FNB Namibia, Standard Bank, Nedbank and Bank Windhoek.'],
  ['How is my information protected?', 'Information is encrypted during transfer and storage. Authentication and device checks are also used to protect account access.'],
  ['Can I correct a transaction category?', 'Yes. You can correct transaction categories when the automatic result is not right.'],
  ['Can I export my information?', 'Yes. Transactions and reports can be exported in common file formats.'],
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-[#dfe5ec] bg-white px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-[1040px] gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#246bfd]">Questions</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#15263c]">Common questions about Mofisc.</h2>
          <p className="mt-4 text-sm leading-6 text-[#5f6f82]">For more information, contact <a href="mailto:support@mofisc.com" className="text-[#245dc7] underline underline-offset-4">support@mofisc.com</a>.</p>
        </div>

        <div className="border-t border-[#dfe5ec]">
          {faqs.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="border-b border-[#dfe5ec]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-5 bg-transparent py-5 text-left hover:bg-transparent"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-[#15263c]">{question}</span>
                  <span className="text-lg font-normal text-[#647386]" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-[#5f6f82]">{answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
