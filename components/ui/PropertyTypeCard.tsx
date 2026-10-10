import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface PropertyTypeCardProps {
  icon: LucideIcon;
  label: string;
  count: string;
  href: string;
}

export default function PropertyTypeCard({ icon: Icon, label, count, href }: PropertyTypeCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-6 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface group-hover:bg-primary-container group-hover:text-on-primary transition-colors mb-4">
        <Icon size={24} />
      </div>
      <span className="text-base font-semibold text-on-surface group-hover:text-secondary transition-colors">
        {label}
      </span>
      <span className="text-sm text-on-surface-variant mt-1">{count}</span>
    </Link>
  );
}
