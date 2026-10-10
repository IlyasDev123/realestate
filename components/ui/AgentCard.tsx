import Link from 'next/link';
import { Phone, Calendar, Star } from 'lucide-react';
import { ApiAgent } from '@/lib/api-types';

interface AgentCardProps {
  agent: ApiAgent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const name = agent.user?.full_name ?? 'Agent';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col p-5 bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Avatar */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-surface-container">
        {agent.user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.user.avatar_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-container bg-surface-container-low font-display">
            {initial}
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-primary-container/80 backdrop-blur-md text-on-primary text-xs font-medium flex items-center gap-1">
          <Star size={10} className="text-secondary-fixed fill-secondary-fixed" />
          4.9 Rating
        </div>
      </div>

      <h3 className="text-base font-semibold text-on-surface">{name}</h3>
      <span className="text-sm text-secondary font-medium mt-0.5">
        {agent.specialization ?? 'Real Estate Advisor'}
      </span>
      <span className="text-xs text-on-surface-variant mt-0.5 truncate">
        {agent.user?.email}
      </span>

      <div className="mt-4 p-2.5 bg-surface-container-low/70 rounded-lg flex items-center justify-between">
        <span className="text-xs text-on-surface-variant">Properties</span>
        <span className="text-sm font-semibold text-secondary">
          {agent.properties_count ?? 0}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {agent.user?.phone ? (
          <a
            href={`tel:${agent.user.phone}`}
            className="flex-1 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <Phone size={13} /> Call
          </a>
        ) : (
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          >
            View Profile
          </Link>
        )}
        <Link
          href={`/agents/${agent.id}`}
          className="flex-1 py-2 rounded-lg bg-primary-container hover:opacity-90 text-on-primary text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <Calendar size={13} /> View Profile
        </Link>
      </div>
    </div>
  );
}
