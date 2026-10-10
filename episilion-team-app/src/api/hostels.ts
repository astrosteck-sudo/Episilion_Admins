import { Platform } from 'react-native';
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
  /** Update requests still awaiting a super admin decision. */
  update_pending: number;
  /** `pending + update_pending` — what the dashboard shows as "Pending". */
  pending_total: number;
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
  /** The full list of perks. The first few are promoted to `amenities` for the card. */
  perks: string[];
  allowInstallments?: boolean;
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

/* ------------------------------ update requests ----------------------------- */

export type UpdateRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UpdateRequest {
  id: number;
  hostel_id: string;
  hostel_name: string;
  main_image: string | null;
  hostel_status: HostelStatus;
  reason: string;
  status: UpdateRequestStatus;
  decision_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  requested_by_name: string | null;
  requested_by_email: string | null;
  reviewed_by_name: string | null;
  /** True when the sub admin has submitted edits awaiting review. */
  has_staged_changes: boolean;
  /** Only the fields that actually differ, with before and after values. */
  staged_diff: StagedDiffEntry[];
}

/** One changed field, resolved for display. */
export interface StagedDiffEntry {
  field: string;
  label: string;
  before: string;
  after: string;
}

/** The latest request for one hostel, or null when there has never been one. */
export interface HostelUpdateRequest {
  id: number;
  hostel_id: string;
  reason: string;
  status: UpdateRequestStatus;
  decision_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
}

/* --------------------------- staged hostel edits ---------------------------- */

/** The fields a sub admin may change. Unlisted fields are never applied. */
export interface HostelChanges {
  name?: string | null;
  type?: string | null;
  university?: string | null;
  year_established?: number | null;
  directions?: string | null;
  distance_to_campus_in_minutes?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  manager_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  office_hours?: string | null;
  website?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  billing_period?: string | null;
  installment_allowed?: boolean | null;
  utilities_fee?: number | null;
  maintenance_fee?: number | null;
  caution_deposit?: number | null;
  refund_policy?: string | null;
  rooms?: { type: string; price: number | null }[];
  perks?: string[];
  rules?: string[];
}

export interface HostelChangeForm {
  hostel: {
    hostel_id: string;
    name: string;
    type: string | null;
    university: string | null;
    year_established: number | null;
    main_image: string | null;
    status: HostelStatus;
  };
  request_id: number;
  request_reason: string;
  /** Non-null when a previous edit set is still awaiting review. */
  staged: HostelChanges | null;
  values: HostelChanges;
}

/** Live values plus the permission check, so the form can be prefilled. */
export async function getHostelChanges(hostelId: string) {
  const res = await apiClient.get<HostelChangeForm>(`/api/team/hostels/${hostelId}/changes`);
  return res.data;
}

/** Stages edits for super admin review. Nothing goes live until it is approved. */
export async function stageHostelChanges(hostelId: string, changes: HostelChanges) {
  const res = await apiClient.put<{ message: string }>(
    `/api/team/hostels/${hostelId}/changes`,
    { changes },
  );
  return res.data;
}

export async function approveStagedChanges(requestId: number) {
  const res = await apiClient.patch<{ message: string; applied: string[] }>(
    `/api/team/hostels/update-requests/${requestId}/changes/approve`,
  );
  return res.data;
}

export async function rejectStagedChanges(requestId: number, reason: string) {
  const res = await apiClient.patch(
    `/api/team/hostels/update-requests/${requestId}/changes/reject`,
    { reason },
  );
  return res.data;
}

/** A hostel name the sub admin typed, resolved to concrete hostels. */
export interface HostelLookupMatch {
  hostel_id: string;
  name: string;
  university: string | null;
  status: HostelStatus;
  latest_request: HostelUpdateRequest | null;
  /** False when the newest request belongs to a different admin. */
  latest_request_is_mine: boolean;
  /** `pending_other` means someone else already has a request queued. */
  request_state: UpdateRequestStatus | 'pending_other' | null;
}

/**
 * Lists hostels that can be requested for update. Called with no name it returns
 * every hostel, so the sub admin can choose from the full list.
 */
export async function listUpdateCandidates(name?: string) {
  const res = await apiClient.get<{ matches: HostelLookupMatch[] }>(
    '/api/team/hostels/update-candidates',
    { params: name ? { name } : undefined },
  );
  return res.data.matches;
}

export async function createUpdateRequest(hostelId: string, reason: string) {
  const res = await apiClient.post<{ message: string; request: HostelUpdateRequest }>(
    `/api/team/hostels/${hostelId}/update-requests`,
    { reason },
  );
  return res.data;
}

export async function listUpdateRequests(status: UpdateRequestStatus | 'all' = 'pending') {
  const res = await apiClient.get<{ requests: UpdateRequest[] }>(
    '/api/team/hostels/update-requests',
    { params: { status } },
  );
  return res.data.requests;
}

export async function getHostelUpdateRequest(hostelId: string) {
  const res = await apiClient.get<{ request: HostelUpdateRequest | null }>(
    `/api/team/hostels/${hostelId}/update-request`,
  );
  return res.data.request;
}

export async function approveUpdateRequest(requestId: number) {
  const res = await apiClient.patch(`/api/team/hostels/update-requests/${requestId}/approve`);
  return res.data;
}

export async function rejectUpdateRequest(requestId: number, reason: string) {
  const res = await apiClient.patch(`/api/team/hostels/update-requests/${requestId}/reject`, {
    reason,
  });
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

/**
 * Appends the photo to the multipart body.
 *
 * React Native accepts a `{ uri, name, type }` descriptor, but the browser's
 * `FormData` only understands `Blob`/`File` — passing the descriptor there would
 * upload the literal string `[object Object]`. On web the picker hands back a
 * `blob:` URL, so the blob is fetched back out first.
 */
async function appendPhoto(form: FormData, photoUri: string) {
  const name = `hostel-${Date.now()}.jpg`;

  if (Platform.OS === 'web') {
    const blob = await (await fetch(photoUri)).blob();
    form.append('photos', blob, name);
    return;
  }

  form.append('photos', {
    uri: photoUri,
    name,
    type: guessMimeType(photoUri),
  } as unknown as Blob);
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
  form.append('perks', JSON.stringify(payload.perks));
  form.append('installment_allowed', payload.allowInstallments ? 'true' : 'false');

  await appendPhoto(form, payload.photoUri);

  const res = await apiClient.post('/api/team/hostels', form, {
    // The Content-Type is left unset so axios keeps the FormData intact and the
    // runtime adds the multipart boundary itself.
    timeout: 60000,
  });
  return res.data;
}
