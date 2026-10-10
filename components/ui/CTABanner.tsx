import Link from 'next/link';
import { Calendar, ArrowRight, Key } from 'lucide-react';

interface CTABannerProps {
  badge?: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export default function CTABanner({
  badge = 'Private Off-Market Network',
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CTABannerProps) {
  return (
    <section className="w-full bg-primary-container text-on-primary relative overflow-hidden py-20 my-8">
      {/* Architectural wireframe background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" fill="none" viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg">
          <line stroke="currentColor" strokeDasharray="8 8" strokeWidth="1" x1="0" x2="1200" y1="100" y2="100" />
          <line stroke="currentColor" strokeDasharray="8 8" strokeWidth="1" x1="0" x2="1200" y1="200" y2="200" />
          <line stroke="currentColor" strokeDasharray="8 8" strokeWidth="1" x1="0" x2="1200" y1="300" y2="300" />
          <line stroke="currentColor" strokeDasharray="8 8" strokeWidth="1" x1="300" x2="300" y1="0" y2="400" />
          <line stroke="currentColor" strokeDasharray="8 8" strokeWidth="1" x1="600" x2="600" y1="0" y2="400" />
          <line stroke="currentColor" strokeDasharray="8 8" strokeWidth="1" x1="900" x2="900" y1="0" y2="400" />
          <circle cx="600" cy="200" r="180" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1080px] mx-auto px-6 lg:px-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 text-secondary-container text-xs font-semibold uppercase tracking-widest mb-4">
          <Key size={14} />
          <span>{badge}</span>
        </div>

        <h2 className="text-4xl lg:text-5xl font-bold text-on-primary font-display tracking-tight max-w-3xl leading-tight mb-4">
          {title}
        </h2>

        <p className="text-on-primary-container max-w-2xl mb-10 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href={primaryHref}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary font-semibold text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
          >
            <Calendar size={16} />
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 backdrop-blur-md text-on-primary font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight size={16} />
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
