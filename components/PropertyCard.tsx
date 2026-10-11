'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Bed, Bath, Square, MapPin, BadgeCheck } from 'lucide-react';
import { ApiProperty } from '@/lib/api-types';
import { favoritesStore } from '@/lib/favorites';

export function formatPrice(price: string | number, purpose: 'sale' | 'rent'): string {
  const n = Number(price);
  const suffix = purpose === 'rent' ? '/mo' : '';
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(1)} Cr${suffix}`;
  if (n >= 100_000)    return `PKR ${(n / 100_000).toFixed(1)} L${suffix}`;
  return `PKR ${n.toLocaleString()}${suffix}`;
}

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial:  'Commercial',
  plot:        'Plot / Land',
};

const PURPOSE_LABELS: Record<string, string> = {
  sale: 'For Sale',
  rent: 'For Rent',
};

interface Props {
  property: ApiProperty;
  variant?: 'grid' | 'list';
}

/* ── Grid Card ── */
function GridCard({ property }: { property: ApiProperty }) {
  const [liked, setLiked] = useState(false);
  const imageUrl = property.images?.[0]?.url ?? null;

  useEffect(() => {
    setLiked(favoritesStore.has(property.id));
  }, [property.id]);

  return (
    <article className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">

      {/* Image */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <Square size={36} className="text-on-surface-variant/30" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {property.is_featured && (
            <span className="px-2.5 py-1 rounded-md bg-primary-container text-on-primary text-xs font-semibold uppercase tracking-wide">
              Featured
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
              property.purpose === 'sale'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-lowest/80 backdrop-blur-md text-on-surface'
            }`}
          >
            {PURPOSE_LABELS[property.purpose]}
          </span>
        </div>

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); setLiked(favoritesStore.toggle(property.id)); }}
          aria-label={liked ? 'Remove from saved' : 'Save listing'}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center transition-colors ${
            liked ? 'text-error' : 'text-on-surface hover:text-error'
          }`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </button>

        {/* Photo count */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-primary-container/70 backdrop-blur-md text-on-primary text-xs font-medium">
            1 / {property.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <Link href={`/properties/${property.id}`} className="p-5 flex flex-col flex-1">
        {/* Price + status */}
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xl font-bold text-on-surface font-display">
            {formatPrice(property.price, property.purpose)}
          </span>
          {property.status === 'available' && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
              <BadgeCheck size={13} className="text-secondary" />
              Verified
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-on-surface group-hover:text-secondary transition-colors line-clamp-1 mb-1">
          {property.title}
        </h3>

        {/* Location */}
        <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1">
          <MapPin size={11} className="shrink-0" />
          {property.city}{property.address ? `, ${property.address}` : ''}
        </p>

        {/* Specs row */}
        <div className="mt-auto flex items-center justify-around flex-wrap gap-1 bg-surface-container-low/50 rounded-xl px-3 py-2 text-on-surface-variant text-xs">
          {property.bedrooms != null && property.bedrooms > 0 && (
            <>
              <span className="flex items-center gap-1"><Bed size={13} /> {property.bedrooms} Beds</span>
              {(property.bathrooms != null || property.area_size != null) && <span>•</span>}
            </>
          )}
          {property.bathrooms != null && (
            <>
              <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} Baths</span>
              {property.area_size != null && <span>•</span>}
            </>
          )}
          {property.area_size != null && (
            <span className="flex items-center gap-1">
              <Square size={13} />
              {Number(property.area_size).toLocaleString()} {property.area_unit}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

/* ── List Card ── */
function ListCard({ property }: { property: ApiProperty }) {
  const [liked, setLiked] = useState(false);
  const imageUrl = property.images?.[0]?.url ?? null;

  useEffect(() => {
    setLiked(favoritesStore.has(property.id));
  }, [property.id]);

  return (
    <article className="flex flex-col sm:flex-row bg-surface-container-lowest border border-outline-variant/10 hover:border-secondary/20 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg group">
      {/* Image */}
      <Link
        href={`/properties/${property.id}`}
        className="relative sm:w-72 h-48 sm:h-auto shrink-0 overflow-hidden bg-surface-container"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <Square size={36} className="text-on-surface-variant/30" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-primary-container text-on-primary text-xs font-semibold">
          {TYPE_LABELS[property.type] ?? property.type}
        </span>
      </Link>

      {/* Details */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              property.purpose === 'sale'
                ? 'bg-secondary-fixed text-on-secondary-fixed'
                : 'bg-surface-container-high text-primary-container'
            }`}>
              {PURPOSE_LABELS[property.purpose]}
            </span>
            <button
              onClick={e => { e.preventDefault(); setLiked(favoritesStore.toggle(property.id)); }}
              aria-label={liked ? 'Remove from saved' : 'Save listing'}
              className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                liked
                  ? 'bg-error border-error text-white'
                  : 'border-outline-variant text-on-surface-variant hover:border-error/50 hover:text-error'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <Link href={`/properties/${property.id}`}>
            <h3 className="font-semibold text-on-surface text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-secondary transition-colors">
              {property.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 text-on-surface-variant text-sm mb-3">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">
              {property.city}{property.address ? `, ${property.address}` : ''}
            </span>
          </div>

          {property.description && (
            <p className="text-sm text-on-surface-variant/80 line-clamp-2 leading-relaxed">
              {property.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            {property.bedrooms != null && property.bedrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <Bed size={13} /> {property.bedrooms} Beds
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1.5">
                <Bath size={13} /> {property.bathrooms} Baths
              </span>
            )}
            {property.area_size != null && (
              <span className="flex items-center gap-1.5">
                <Square size={13} />
                {Number(property.area_size).toLocaleString()} {property.area_unit}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-on-surface font-display">
            {formatPrice(property.price, property.purpose)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function PropertyCard({ property, variant = 'grid' }: Props) {
  if (variant === 'list') return <ListCard property={property} />;
  return <GridCard property={property} />;
}
