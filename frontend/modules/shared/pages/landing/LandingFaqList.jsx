import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function LandingFaqList({ items, idPrefix = 'landing-faq' }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="border-t border-[#d7e2d3] dark:border-white/10">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${idPrefix}-question-${index}`;
        const panelId = `${idPrefix}-answer-${index}`;

        return (
          <div
            key={item.question}
            data-landing-reveal
            style={{ '--landing-part-delay': `${120 + index * 70}ms` }}
            className="border-b border-[#d7e2d3] dark:border-white/10"
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group flex min-h-[44px] w-full items-center justify-between gap-5 py-5 text-left text-base font-semibold leading-7 text-[#173225] outline-none transition-colors duration-200 hover:text-[#31572c] focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-[#588157] focus-visible:ring-offset-4 active:text-[#274823] dark:text-white dark:hover:text-[#a9c8ad] dark:focus-visible:ring-[#8db692] dark:focus-visible:ring-offset-[#15191b] sm:py-6 sm:text-lg"
              >
                <span className="text-pretty">{item.question}</span>
                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center justify-center text-[#31572c] transition-colors duration-200 group-hover:text-[#173225] dark:text-[#b9d3bc] dark:group-hover:text-white"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    strokeWidth={2}
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 pr-14 text-pretty leading-7 text-[#596d5d] dark:text-[#b9c5bd]">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
