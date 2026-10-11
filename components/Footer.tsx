import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, MessageSquare, AtSign, Rss, Globe } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Buy', href: '/properties?purpose=sale' },
  { label: 'Rent', href: '/properties?purpose=rent' },
  { label: 'Commercial', href: '/properties?type=commercial' },
  { label: 'Off-Market', href: '/contact' },
  { label: 'List Property', href: '/add-property' },
];

const PROPERTY_TYPES = [
  { label: 'Villas & Estates', href: '/properties?type=residential' },
  { label: 'Modern Penthouses', href: '/properties?type=residential' },
  { label: 'Waterfront Homes', href: '/properties?type=residential' },
  { label: 'Historic Townhomes', href: '/properties?type=residential' },
  { label: 'Land & Acreage', href: '/properties?type=plot' },
];

const SOCIAL = [
  { icon: MessageSquare, href: '#' },
  { icon: AtSign, href: '#' },
  { icon: Rss, href: '#' },
  { icon: Globe, href: '#' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-primary-container text-on-primary-container">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-8 pt-16 pb-8">

        {/* ── Grid columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
                <Building2 size={16} className="text-on-secondary-container" />
              </div>
              <span className="text-xl font-semibold text-on-primary tracking-tight font-display">
                EstateLux
              </span>
            </div>
            <p className="text-sm text-on-primary-container leading-relaxed">
              EstateLux Premier Realty — Curated luxury residences, penthouses, and private estates across premier global destinations.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg border border-on-primary/20 flex items-center justify-center text-on-primary-container hover:text-on-primary hover:border-on-primary/40 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-on-primary uppercase tracking-wider">
              Quick Links
            </span>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-on-primary-container hover:text-on-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-on-primary uppercase tracking-wider">
              Property Types
            </span>
            <ul className="flex flex-col gap-2.5">
              {PROPERTY_TYPES.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-on-primary-container hover:text-on-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-on-primary uppercase tracking-wider">
              Contact &amp; Concierge
            </span>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-on-primary font-medium mb-0.5">Global Inquiries</p>
                <a
                  href="mailto:hello@lezood.com"
                  className="text-sm text-on-primary-container hover:text-on-primary transition-colors flex items-center gap-2"
                >
                  <Mail size={13} className="text-secondary-container shrink-0" />
                  hello@lezood.com
                </a>
              </div>
              <div>
                <p className="text-sm text-on-primary font-medium mb-0.5">Phone</p>
                <a
                  href="tel:+923114910259"
                  className="text-sm text-on-primary-container hover:text-on-primary transition-colors flex items-center gap-2"
                >
                  <Phone size={13} className="text-secondary-container shrink-0" />
                  923114910259
                </a>
              </div>
              <div>
                <p className="text-sm text-on-primary font-medium mb-0.5">Headquarters</p>
                <p className="text-sm text-on-primary-container flex items-start gap-2">
                  <MapPin size={13} className="text-secondary-container shrink-0 mt-0.5" />
                  Rodeo Drive, Beverly Hills &amp; Madison Ave, Manhattan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="pt-8 border-t border-on-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-primary-container">
            © {new Date().getFullYear()} EstateLux Premier Realty Inc. Equal Housing Opportunity.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Sitemap'].map(item => (
              <a
                key={item}
                href="#"
                className="text-xs text-on-primary-container hover:text-on-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
