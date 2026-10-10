export type PropertyType = 'villa' | 'apartment' | 'house' | 'penthouse' | 'townhouse' | 'studio';
export type PropertyStatus = 'for-sale' | 'for-rent';
export type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest' | 'area-asc' | 'area-desc';
export type ViewMode = 'grid' | 'list';

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  title: string;
  listings: number;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  location: PropertyLocation;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  description: string;
  features: string[];
  yearBuilt: number;
  agent: Agent;
  isFeatured: boolean;
  isNew: boolean;
  createdAt: string;
  garage: number;
  floors: number;
}

export interface FilterState {
  search: string;
  type: PropertyType | 'all';
  status: PropertyStatus | 'all';
  minPrice: number;
  maxPrice: number;
  minBedrooms: number;
  minBathrooms: number;
  location: string;
  sort: SortOption;
}
