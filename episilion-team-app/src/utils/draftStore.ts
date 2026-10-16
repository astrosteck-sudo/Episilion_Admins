import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';
import { STORAGE_KEYS } from '../constants';
import { isWeb } from './platform';

/**
 * Local, per-device storage for half-finished "add hostel" forms.
 *
 * Drafts are deliberately kept out of `utils/storage`: that adapter writes to the
 * keychain, which is meant for credentials and caps a value at a couple of
 * kilobytes. A draft is neither secret nor small, so native keeps an index file
 * plus one photo per draft in the document directory (which the OS does not
 * reclaim the way it does the cache directory) and web keeps the index in
 * `localStorage` with the photo inlined.
 */

/** Bumped when the draft shape changes, so older drafts are ignored rather than misread. */
const DRAFT_VERSION = 1;

const DRAFT_DIR = 'drafts';
const DRAFT_INDEX = 'index.json';

/** Longest edge kept when a web draft photo is inlined into `localStorage`. */
const WEB_PHOTO_MAX_WIDTH = 1280;
const WEB_PHOTO_QUALITY = 0.7;

/** The form fields a draft captures. */
export interface HostelDraftForm {
  hostelName: string;
  latitude: string;
  longitude: string;
  roomTypes: { type: string; price: string }[];
  selectedAmenities: string[];
  allowInstallments: boolean;
  managerName: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  photo: string | null;
}

export interface HostelDraft extends HostelDraftForm {
  id: string;
  version: number;
  /** Owner of the draft; drafts left behind by another account are ignored. */
  userId: string;
  savedAt: string;
}

function webStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function draftDirectory() {
  return new Directory(Paths.document, DRAFT_DIR);
}

function draftIndexFile() {
  return new File(draftDirectory(), DRAFT_INDEX);
}

/** One photo per draft, so saving a second draft cannot overwrite the first one's. */
function draftPhotoFile(id: string) {
  return new File(draftDirectory(), `photo-${id}.jpg`);
}

/** Ids are generated here, so they are safe to use in a file name. */
function newDraftId() {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readRaw(): Promise<string | null> {
  if (isWeb) return webStorage()?.getItem(STORAGE_KEYS.HOSTEL_DRAFTS) ?? null;

  const file = draftIndexFile();
  if (!file.exists) return null;
  return file.text();
}

async function writeRaw(value: string): Promise<void> {
  if (isWeb) {
    webStorage()?.setItem(STORAGE_KEYS.HOSTEL_DRAFTS, value);
    return;
  }

  draftDirectory().create({ intermediates: true, idempotent: true });
  draftIndexFile().write(value);
}

/** Reads the stored drafts, newest first. A corrupt index reads as "no drafts". */
async function readDrafts(): Promise<HostelDraft[]> {
  try {
    const raw = await readRaw();
    if (!raw) return [];

    const parsed = JSON.parse(raw) as HostelDraft[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((draft) => draft?.version === DRAFT_VERSION)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    // A corrupt index must never block the form.
    return [];
  }
}

async function writeDrafts(drafts: HostelDraft[]): Promise<void> {
  await writeRaw(JSON.stringify(drafts));
}

/**
 * Copies the picked photo somewhere that outlives the picker's temporary file.
 *
 * Native: the picker returns a cache URI that the OS may reclaim, so the file is
 * copied into the document directory. Web: the picker returns a `blob:` URL that
 * dies with the page, so the bytes are inlined as a downscaled data URL — which
 * also keeps the value inside the `localStorage` quota and still works with the
 * `fetch()` in the submit path.
 */
export async function persistDraftPhoto(uri: string, draftId: string): Promise<string> {
  if (isWeb) {
    // Already inlined by an earlier save; re-encoding would only lose quality.
    if (uri.startsWith('data:')) return uri;

    const actions = await resizeActionsFor(uri);
    const result = await manipulateAsync(uri, actions, {
      compress: WEB_PHOTO_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    });
    return `data:image/jpeg;base64,${result.base64}`;
  }

  const target = draftPhotoFile(draftId);
  const source = new File(uri);
  // Re-saving an untouched draft would otherwise copy the file onto itself.
  if (source.uri === target.uri) return target.uri;

  draftDirectory().create({ intermediates: true, idempotent: true });
  if (target.exists) target.delete();
  await source.copy(target);
  return target.uri;
}

/** Downscales only when the image is wider than the cap, so small photos are not upscaled. */
async function resizeActionsFor(uri: string) {
  try {
    const { width } = await new Promise<{ width: number; height: number }>((resolve, reject) =>
      Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject),
    );
    return width > WEB_PHOTO_MAX_WIDTH ? [{ resize: { width: WEB_PHOTO_MAX_WIDTH } }] : [];
  } catch {
    // An unreadable size is not worth failing the save over; the cap still applies.
    return [{ resize: { width: WEB_PHOTO_MAX_WIDTH } }];
  }
}

/** Deletes the stored copy of a draft photo. Web inlines the bytes, so there is nothing to remove. */
export async function discardDraftPhoto(uri: string | null | undefined): Promise<void> {
  if (!uri || isWeb) return;

  const file = new File(uri);
  if (file.exists) file.delete();
}

/** Every draft this account has saved, newest first. */
export async function listDrafts(userId: string): Promise<HostelDraft[]> {
  const drafts = await readDrafts();
  return drafts.filter((draft) => draft.userId === userId);
}

/** Reads one draft by id, or `null` when it is gone or belongs to someone else. */
export async function loadDraft(userId: string, id: string): Promise<HostelDraft | null> {
  const drafts = await listDrafts(userId);
  return drafts.find((draft) => draft.id === id) ?? null;
}

/**
 * Creates or updates a draft and returns it, so the caller can show when it was
 * saved. Passing an existing `id` overwrites that draft; omitting it starts a
 * new one, which is what keeps a second hostel from clobbering the first.
 */
export async function saveDraft(
  userId: string,
  form: HostelDraftForm,
  id?: string,
): Promise<HostelDraft> {
  const drafts = await readDrafts();
  const draft: HostelDraft = {
    ...form,
    id: id ?? newDraftId(),
    version: DRAFT_VERSION,
    userId,
    savedAt: new Date().toISOString(),
  };

  const index = drafts.findIndex((item) => item.id === draft.id);
  if (index >= 0) {
    drafts[index] = draft;
  } else {
    drafts.push(draft);
  }

  await writeDrafts(drafts);
  return draft;
}

/** Removes one draft and the photo copy it points at. */
export async function deleteDraft(id: string): Promise<void> {
  const drafts = await readDrafts();
  const draft = drafts.find((item) => item.id === id);

  await discardDraftPhoto(draft?.photo);
  await writeDrafts(drafts.filter((item) => item.id !== id));
}
