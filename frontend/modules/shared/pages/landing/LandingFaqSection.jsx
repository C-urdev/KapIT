import LandingFaqList from './LandingFaqList';
import { USER_LANDING_FAQ } from './landingData';

export default function LandingFaqSection({ compact = false }) {
  return (
    <section
      aria-labelledby="user-landing-faq-title"
      className={
        compact
          ? 'relative -mx-5 mt-20 bg-[#fbfdf9] px-5 dark:bg-[#15191b]'
          : 'relative overflow-hidden bg-[#fbfdf9] dark:bg-[#15191b]'
      }
    >
      <div
        className={
          compact
            ? 'py-14'
            : 'landing-desktop-shell grid gap-12 py-24 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:py-28'
        }
      >
        <div>
          <h2
            id="user-landing-faq-title"
            data-landing-reveal
            className={`text-balance font-semibold tracking-[-0.05em] text-[#102a1b] dark:text-white ${
              compact ? 'text-[2.25rem] leading-[1.05]' : 'text-4xl'
            }`}
          >
            Before you start applying
          </h2>
          <p data-landing-reveal style={{ '--landing-part-delay': '100ms' }} className="mt-4 max-w-sm text-pretty leading-7 text-[#596d5d] dark:text-[#b9c5bd]">
            Answers that help you shape your profile, follow matches, and track each application.
          </p>
        </div>

        <div>
          <LandingFaqList items={USER_LANDING_FAQ} idPrefix="user-landing-faq" />
        </div>
      </div>
    </section>
  );
}
