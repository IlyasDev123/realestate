'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/dashboard/PropertyForm';

export default function AgentUploadPropertyPage() {
  const router = useRouter();
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
          <h1 className="text-2xl font-bold text-on-surface tracking-tight font-display">Upload New Property</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Complete all steps to list your property. Draft listings are not visible on the public portal.
          </p>
        </div>
      </div>
      <PropertyForm />
    </div>
  );
}
