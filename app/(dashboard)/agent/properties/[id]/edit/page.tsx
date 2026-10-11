'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { propertiesApi } from '@/lib/api';
import { ApiProperty } from '@/lib/api-types';
import PropertyForm from '@/components/dashboard/PropertyForm';

export default function AgentEditPropertyPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    propertiesApi.get(id)
      .then((res) => setProperty(res.data))
      .catch(() => setError('Failed to load property.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-4 bg-error-container border border-error/20 rounded-xl text-on-error-container text-sm">
        {error || 'Property not found.'}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-on-surface-variant">Edit the details for your property listing.</p>
      </div>
      <PropertyForm
        propertyId={property.id}
        defaults={{
          title: property.title,
          description: property.description ?? undefined,
          type: property.type,
          purpose: property.purpose,
          price: Number(property.price),
          city: property.city,
          address: property.address ?? undefined,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area_size: property.area_size ? Number(property.area_size) : undefined,
          area_unit: property.area_unit,
          floor: property.floor,
          parking_spaces: property.parking_spaces,
          amenities: property.amenities ?? [],
          status: property.status,
          imageUrls: property.images.map((i) => ({ id: i.id, url: i.url })),
        }}
      />
    </div>
  );
}
