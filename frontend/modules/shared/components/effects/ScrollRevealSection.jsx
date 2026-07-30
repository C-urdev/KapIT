import React, { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

const DEFAULT_ROOT_MARGIN = '0px 0px -22% 0px';
const REVEAL_EASING = [0.32, 0.72, 0, 1];

export default function ScrollRevealSection({
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  startVisible = false,
  style,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const targets = Array.from(element.querySelectorAll('[data-landing-reveal]'));
    if (targets.length === 0) return undefined;

    targets.forEach((target) => {
      delete target.dataset.revealStarted;
      delete target.dataset.revealed;
      target.style.removeProperty('opacity');
      target.style.removeProperty('translate');
      target.style.removeProperty('filter');
    });

    const activeAnimations = new Set();
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const revealTarget = (target) => {
      if (target.dataset.revealStarted === 'true') return;
      target.dataset.revealStarted = 'true';

      const computedStyle = window.getComputedStyle(target);
      const sectionDelay = Number.parseFloat(computedStyle.getPropertyValue('--landing-reveal-delay')) || 0;
      const partDelay = Number.parseFloat(computedStyle.getPropertyValue('--landing-part-delay')) || 0;
      const controls = animate(
        target,
        {
          opacity: 1,
          translate: '0 0px',
          filter: 'blur(0px)',
        },
        {
          delay: (sectionDelay + partDelay) / 1000,
          duration: prefersReducedMotion ? 0.55 : 1.05,
          ease: REVEAL_EASING,
        },
      );

      activeAnimations.add(controls);
      controls.then(() => {
        target.dataset.revealed = 'true';
        activeAnimations.delete(controls);
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(revealTarget);
      return () => activeAnimations.forEach((controls) => controls.stop());
    }

    if (startVisible) {
      const frame = window.requestAnimationFrame(() => targets.forEach(revealTarget));
      return () => {
        window.cancelAnimationFrame(frame);
        activeAnimations.forEach((controls) => controls.stop());
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealTarget(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: DEFAULT_ROOT_MARGIN, threshold: 0.18 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      activeAnimations.forEach((controls) => controls.stop());
    };
  }, [startVisible]);

  return (
    <Component
      ref={ref}
      className={`landing-scroll-reveal ${className}`.trim()}
      style={{ ...style, '--landing-reveal-delay': `${delay}ms` }}
      {...props}
    >
      {children}
    </Component>
  );
}
