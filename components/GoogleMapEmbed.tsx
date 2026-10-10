'use client';

import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface GoogleMapEmbedProps {
  latitude?: string | null;
  longitude?: string | null;
  city: string;
  address?: string | null;
  title?: string;
  height?: number;
}

export default function GoogleMapEmbed({
  latitude,
  longitude,
  city,
  address,
  title,
  height = 380,
}: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const locationParts = [address, city, 'Pakistan'].filter(Boolean);
  const queryString = latitude && longitude
    ? `${latitude},${longitude}`
    : encodeURIComponent(locationParts.join(', '));

  const googleMapsUrl = `https://maps.google.com/?q=${queryString}`;

  if (!apiKey) {
    return (
      <div
        style={{ height }}
        className="relative rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest flex flex-col items-center justify-center"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(13,28,50,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(13,28,50,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center mx-auto mb-4">
            <MapPin size={26} className="text-secondary" />
          </div>
          <p className="font-display text-lg font-semibold text-on-surface mb-1">{city}</p>
          {address && <p className="text-on-surface-variant text-sm mb-1">{address}</p>}
          <p className="text-on-surface-variant text-xs mb-4">
            Add <code className="text-secondary font-mono text-xs bg-secondary-fixed/30 px-1.5 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-on-surface border border-secondary/30 hover:border-secondary/60 px-3 py-1.5 rounded-full transition-colors"
          >
            <Navigation size={11} />
            Open in Google Maps
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative rounded-xl overflow-hidden border border-outline-variant/30 group">
      <iframe
        title={title ?? `${city} - Property Location`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${queryString}&zoom=15`}
      />
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ExternalLink size={10} />
        Open in Maps
      </a>
    </div>
  );
}
