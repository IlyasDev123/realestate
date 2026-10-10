import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  badge: string;
  value: string;
  label: string;
  description: string;
}

export default function StatCard({ icon: Icon, badge, value, label, description }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 p-5 bg-surface-container-lowest rounded-2xl shadow-sm">
      <div className="flex items-center justify-between text-secondary mb-2">
        <Icon size={22} />
        <span className="text-xs font-semibold bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full">
          {badge}
        </span>
      </div>
      <span className="text-2xl lg:text-3xl font-bold text-primary-container font-display mt-1">
        {value}
      </span>
      <span className="text-sm font-semibold text-on-surface">{label}</span>
      <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">{description}</p>
    </div>
  );
}
