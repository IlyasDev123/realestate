'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { agentsApi } from '@/lib/api';
import PropertyForm from '@/components/dashboard/PropertyForm';

export default function AdminAddPropertyPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    agentsApi.list({ per_page: 100 })
      .then(res =>
        setAgents(
          res.data
            .filter(a => a.approval_status === 'approved')
            .map(a => ({ id: a.id, name: a.user?.full_name ?? a.id }))
        )
      )
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight font-display">Add New Property</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Fill in all steps to create the listing. You can assign it to an agent or leave it unassigned.
          </p>
        </div>
      </div>
      <PropertyForm agents={agents} />
    </div>
  );
}
