export interface ApiMonthStat {
  month: string;
  label: string;
  count: number;
  volume?: number;
}

export interface ApiActivityItem {
  type: 'deal' | 'lead';
  id: string;
  title: string;
  sub: string;
  badge: string;
  agent_name?: string;
  amount?: string;
  property?: string;
  phone?: string;
  created_at: string;
}

export interface ApiActiveDeal {
  id: string;
  deal_type: string;
  deal_status: string;
  amount: string;
  property: string | null;
  agent_name: string | null;
  created_at: string;
}

export interface ApiStats {
  // counts
  agents_count: number;
  properties_count: number;
  total_properties: number;
  total_leads: number;
  total_clients: number;
  total_deals: number;
  completed_deals: number;
  pending_deals: number;
  confirmed_deals: number;
  // values
  total_volume: string;
  closed_volume: string;
  commission_earned: string;
  portfolio_value: string;
  // breakdowns
  leads_by_status: Record<string, number>;
  top_cities: Record<string, number>;
  // monthly series
  deals_by_month: ApiMonthStat[];
  leads_by_month: ApiMonthStat[];
  // lists
  recent_activity: ApiActivityItem[];
  active_deals: ApiActiveDeal[];
  featured_agents: ApiAgent[];
}

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string | null; // 'super_admin' | 'manager' | 'agent'
  agent?: ApiAgent;
}

export interface ApiAgent {
  id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  cnic: string | null;
  joining_date: string | null;
  specialization: string | null;
  bio: string | null;
  rejection_reason: string | null;
  commission_default_pct?: string;
  properties_count?: number;
  closed_deals_count?: number | null;
  total_volume?: string | null;
  user?: Pick<ApiUser, 'id' | 'full_name' | 'email' | 'phone' | 'avatar_url'>;
}

export interface ApiPropertyImage {
  id: string;
  url: string;
  sort_order: number;
}

export interface ApiProperty {
  id: string;
  title: string;
  description: string | null;
  type: 'residential' | 'commercial' | 'plot';
  purpose: 'sale' | 'rent';
  price: string;
  city: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_size: string | null;
  area_unit: 'sqft' | 'marla' | 'kanal';
  floor: number | null;
  parking_spaces: number;
  amenities: string[] | null;
  status: 'draft' | 'available' | 'reserved' | 'sold' | 'rented';
  is_featured: boolean;
  views_count: number;
  inquiries_count: number;
  images: ApiPropertyImage[];
  agent?: {
    id: string;
    user: Pick<ApiUser, 'id' | 'full_name' | 'email'>;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiClient {
  id: string;
  name: string;
  cnic: string | null;
  phone: string;
  email: string | null;
  type: 'buyer' | 'seller' | 'tenant' | 'landlord';
  address: string | null;
  notes: string | null;
  created_at: string;
  leads?: ApiLead[];
  deals?: ApiDeal[];
}

export interface ApiLead {
  id: string;
  client_name: string;
  phone: string;
  email: string | null;
  source: string;
  status: 'new' | 'contacted' | 'site_visit' | 'negotiation' | 'closed_won' | 'closed_lost';
  notes: string | null;
  visitor_message: string | null;
  next_followup_at: string | null;
  interested_property_id: string | null;
  property?: ApiProperty;
  client?: ApiClient;
  agent?: ApiAgent;
  created_at: string;
  updated_at: string;
}

export interface ApiDeal {
  id: string;
  deal_type: 'sale' | 'rent';
  amount: string;
  commission_pct: string;
  commission_amount: string;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_date: string | null;
  deal_status: 'pending' | 'confirmed' | 'completed';
  notes: string | null;
  property?: ApiProperty;
  client?: ApiClient;
  agent?: ApiAgent;
  created_at: string;
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_type: string | null;
  related_id: string | null;
  created_at: string;
}

export interface ApiSetting {
  agency_name: string;
  logo_url: string | null;
  default_commission_pct: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  business_hours: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: { first: string; last: string; prev: string | null; next: string | null };
}

export interface NotificationsListResponse extends PaginatedResponse<ApiNotification> {
  unread_count: number;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// Form payloads
export interface SubmitLeadPayload {
  client_name: string;
  phone: string;
  email?: string;
  interested_property_id?: string;
  visitor_message?: string;
}

export interface UpdateLeadPayload {
  status?: ApiLead['status'];
  notes?: string;
  next_followup_at?: string | null;
  assigned_agent_id?: string | null;
}

export interface ClientPayload {
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  type: ApiClient['type'];
  address?: string;
  notes?: string;
}

export interface DealPayload {
  property_id: string;
  client_id: string;
  agent_id?: string;
  lead_id?: string;
  deal_type: 'sale' | 'rent';
  amount: number;
  commission_pct: number;
  payment_status?: 'pending' | 'partial' | 'paid';
  payment_date?: string | null;
  deal_status?: 'pending' | 'confirmed' | 'completed';
  notes?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
  bio?: string;
  specialization?: string;
  cnic?: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  cnic?: string;
  specialization?: string;
  bio?: string;
}

export interface CreateLeadPayload {
  client_name: string;
  phone: string;
  email?: string;
  source: 'walk_in' | 'referral' | 'call' | 'website' | 'contact_form';
  interested_property_id?: string;
  assigned_agent_id?: string;
  notes?: string;
  next_followup_at?: string;
  status?: ApiLead['status'];
}

export interface ApiAgentDossierStats {
  properties_count: number;
  available_properties_count: number;
  sold_properties_count: number;
  rented_properties_count: number;
  leads_count: number;
  new_leads_count: number;
  won_leads_count: number;
  lost_leads_count: number;
  deals_count: number;
  completed_deals_count: number;
  confirmed_deals_count: number;
  pending_deals_count: number;
  total_volume: string;
  total_commission: string;
}

export interface ApiAgentDossier {
  agent: ApiAgent;
  stats: ApiAgentDossierStats;
  recent_properties: ApiProperty[];
  recent_leads: ApiLead[];
  recent_deals: ApiDeal[];
}

export interface AdminCreateUserPayload {
  role: 'agent' | 'manager';
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  // agent-only
  cnic?: string;
  specialization?: string;
  bio?: string;
  commission_default_pct?: number;
  joining_date?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface PropertyPayload {
  title: string;
  description?: string;
  type: 'residential' | 'commercial' | 'plot';
  purpose: 'sale' | 'rent';
  price: number;
  city: string;
  address?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_size?: number | null;
  area_unit?: 'sqft' | 'marla' | 'kanal';
  floor?: number | null;
  parking_spaces?: number;
  amenities?: string[];
  status?: 'draft' | 'available' | 'reserved' | 'sold' | 'rented';
  agent_id?: string;
  is_featured?: boolean;
  image_urls?: string[];
}
