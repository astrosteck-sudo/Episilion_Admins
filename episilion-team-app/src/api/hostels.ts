import { apiClient } from './client';

export type HostelStatus = 'pending' | 'approved' | 'rejected';

export interface HostelListItem {
  hostel_id: string;
  name: string;
  type: string | null;
  university: string | null;
  year_established: number | null;
  main_image: string | null;
  status: HostelStatus;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  distance_to_campus_in_minutes: number | null;
  directions: string | null;
  manager_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  office_hours: string | null;
  website: string | null;
  price_min: number | null;
  price_max: number | null;
  photo_count: number;
  amenity_count: number;
  room_count: number;
  submitted_by_name: string | null;
}

export interface HostelDetailResponse {
  hostel: HostelListItem & {
    average_rating: string | number | null;
    total_reviews: number | null;
    created_by: number | null;
    reviewed_by: number | null;
    reviewed_by_name: string | null;
    submitted_by_email: string | null;
  };
  location: {
    latitude: string | number | null;
    longitude: string | number | null;
    distance_to_campus_in_minutes: number | null;
    directions: string | null;
  } | null;
  contact: {
    manager_name: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    office_hours: string | null;
    website: string | null;
  } | null;
  rooms: { room_id: number; room_type: string | null; price: number | null; available_rooms: number | null }[];
  amenities: string[];
  furnishing: string[];
  rules: string[];
  media: { media_id: number; url: string; type: string | null }[];
  pricing: Record<string, unknown> | null;
  log: { action: string; note: string | null; created_at: string; performed_by_name: string | null }[];
}

export interface HostelStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface NewHostelPayload {
  name: string;
  type?: string;
  university?: string;
  yearEstablished?: string;
  latitude: string;
  longitude: string;
  directions?: string;
  distanceToCampus?: string;
  roomTypes: { type: string; price: string }[];
  amenities: string[];
  managerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  officeHours?: string;
  photoUri: string;
}

export async function listHostels(status: HostelStatus | 'all' = 'pending') {
  const res = await apiClient.get<{ hostels: HostelListItem[] }>('/api/team/hostels', {
    params: { status },
  });
  return res.data.hostels;
}

export async function getHostel(id: string) {
  const res = await apiClient.get<HostelDetailResponse>(`/api/team/hostels/${id}`);
  return res.data;
}

export async function getHostelStats() {
  const res = await apiClient.get<{ stats: HostelStats }>('/api/team/hostels/stats');
  return res.data.stats;
}

export async function approveHostel(id: string) {
  const res = await apiClient.patch(`/api/team/hostels/${id}/approve`);
  return res.data;
}

export async function rejectHostel(id: string, reason: string) {
  const res = await apiClient.patch(`/api/team/hostels/${id}/reject`, { reason });
  return res.data;
}

/** Infers the mime type from the file extension so multipart uploads are typed correctly. */
function guessMimeType(uri: string) {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

export async function createHostel(payload: NewHostelPayload) {
  const form = new FormData();

  form.append('name', payload.name);
  form.append('latitude', payload.latitude);
  form.append('longitude', payload.longitude);
  form.append('manager_name', payload.managerName);
  form.append('phone', payload.phone);

  if (payload.type) form.append('type', payload.type);
  if (payload.university) form.append('university', payload.university);
  if (payload.yearEstablished) form.append('year_established', payload.yearEstablished);
  if (payload.directions) form.append('directions', payload.directions);
  if (payload.distanceToCampus) {
    form.append('distance_to_campus_in_minutes', payload.distanceToCampus);
  }
  if (payload.whatsapp) form.append('whatsapp', payload.whatsapp);
  if (payload.email) form.append('email', payload.email);
  if (payload.website) form.append('website', payload.website);
  if (payload.officeHours) form.append('office_hours', payload.officeHours);

  form.append('room_types', JSON.stringify(payload.roomTypes.filter((r) => r.type)));
  form.append('amenities', JSON.stringify(payload.amenities));

  form.append('photos', {
    uri: payload.photoUri,
    name: `hostel-${Date.now()}.jpg`,
    type: guessMimeType(payload.photoUri),
  } as unknown as Blob);

  const res = await apiClient.post('/api/team/hostels', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data;
}
