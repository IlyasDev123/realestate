import Link from 'next/link';
import { Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
import { ApiClient } from '@/lib/api-types';

const typeStyle: Record<ApiClient['type'], { bg: string; text: string; dot: string }> = {
  buyer:    { bg: 'bg-secondary/10',           text: 'text-secondary',           dot: 'bg-secondary' },
  seller:   { bg: 'bg-primary-container/10',   text: 'text-primary-container',   dot: 'bg-primary-container' },
  tenant:   { bg: 'bg-outline-variant/30',     text: 'text-on-surface-variant',  dot: 'bg-outline' },
  landlord: { bg: 'bg-surface-container-high', text: 'text-on-surface',          dot: 'bg-outline-variant' },
};

interface ClientCardProps {
  client: ApiClient;
  href: string;
  extraField?: 'notes' | 'address';
}

export function ClientCard({ client, href, extraField }: ClientCardProps) {
  const s = typeStyle[client.type];
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(13,28,50,0.06)]"
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-secondary">{client.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-on-surface truncate">{client.name}</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize mt-1 ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {client.type}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-2.5 flex-1">
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Phone size={13} className="shrink-0 text-secondary/70" /> {client.phone}
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Mail size={13} className="shrink-0 text-secondary/70" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {extraField === 'notes' && client.notes && (
          <p className="text-xs text-on-surface-variant/70 line-clamp-2 mt-0.5">{client.notes}</p>
        )}
        {extraField === 'address' && client.address && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <MapPin size={13} className="shrink-0 text-secondary/70" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-end">
        <ChevronRight size={15} className="text-outline-variant group-hover:text-secondary transition-colors" />
      </div>
    </Link>
  );
}
