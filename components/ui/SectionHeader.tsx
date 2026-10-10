interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} ${className}`}>
      <span className="text-xs font-semibold text-secondary tracking-widest uppercase">
        {eyebrow}
      </span>
      <h2 className="text-3xl lg:text-4xl font-bold text-on-surface font-display tracking-tight mt-1">
        {title}
      </h2>
      {subtitle && (
        <p className="text-on-surface-variant mt-3 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
