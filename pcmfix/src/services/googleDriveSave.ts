import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChecklistItem, SubjectKey } from '../types/checklist';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'] as const;

export const SAVE_FILE_NAME = 'pcm-study-checklist-save.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface DriveSaveFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export interface DriveSavePayload {
  version: 1;
  updatedAt: string;
  activeSubject: SubjectKey;
  expandedUnits: Record<string, boolean>;
  items: ChecklistItem[];
}

export class DriveAuthExpiredError extends Error {
  constructor(message = 'Google Drive session expired. Please sign in again.') {
    super(message);
    this.name = 'DriveAuthExpiredError';
  }
}

export function initAuth(
  onAuthSuccess: (user: User, accessToken: string) => void,
  onAuthFailure: (rememberedUser: User | null) => void
) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure(null);
    }
  });
}

export async function googleSignIn(): Promise<{
  user: User;
  accessToken: string;
}> {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Could not obtain Google Drive permission token. Please try signing in again.'
      );
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

export function clearAccessToken(): void {
  cachedAccessToken = null;
}

export async function logout(): Promise<void> {
  cachedAccessToken = null;
  await auth.signOut();
}

async function handleDriveError(res: Response, fallbackMsg: string): Promise<never> {
  if (res.status === 401) {
    cachedAccessToken = null;
    throw new DriveAuthExpiredError();
  }
  let detail = fallbackMsg;
  try {
    const data = await res.json();
    if (data?.error?.message) {
      detail = data.error.message;
    }
  } catch {
    // Ignore non-JSON error responses
  }
  throw new Error(detail);
}

export async function findSaveFile(
  accessToken: string
): Promise<DriveSaveFileMetadata | null> {
  const query = `name='${SAVE_FILE_NAME}' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    spaces: 'drive',
    fields: 'files(id,name,modifiedTime,size,webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '1',
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    await handleDriveError(res, 'Failed to check Google Drive for save file.');
  }

  const data = (await res.json()) as { files?: DriveSaveFileMetadata[] };
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

export async function readSaveFile(
  accessToken: string,
  fileId: string
): Promise<DriveSavePayload> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    await handleDriveError(res, 'Failed to read save file from Google Drive.');
  }

  const parsed = (await res.json()) as Partial<DriveSavePayload>;
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error('The Google Drive save file is not a valid PCM checklist save.');
  }

  return {
    version: 1,
    updatedAt:
      typeof parsed.updatedAt === 'string'
        ? parsed.updatedAt
        : new Date().toISOString(),
    activeSubject:
      parsed.activeSubject === 'physics' ||
      parsed.activeSubject === 'chemistry' ||
      parsed.activeSubject === 'maths'
        ? parsed.activeSubject
        : 'physics',
    expandedUnits:
      parsed.expandedUnits && typeof parsed.expandedUnits === 'object'
        ? parsed.expandedUnits
        : { P1: true, C1: true, M1: true },
    items: parsed.items,
  };
}

export async function createSaveFile(
  accessToken: string,
  payload: DriveSavePayload
): Promise<DriveSaveFileMetadata> {
  const metadata = {
    name: SAVE_FILE_NAME,
    mimeType: 'application/json',
    description: 'PCM Study Checklist cloud save file',
  };

  const boundary = `pcm-save-${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(payload, null, 2)}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    await handleDriveError(res, 'Failed to create save file in Google Drive.');
  }

  return (await res.json()) as DriveSaveFileMetadata;
}

export async function updateSaveFile(
  accessToken: string,
  fileId: string,
  payload: DriveSavePayload
): Promise<DriveSaveFileMetadata> {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId
    )}?uploadType=media&fields=id,name,modifiedTime,size,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(payload, null, 2),
    }
  );

  if (!res.ok) {
    await handleDriveError(res, 'Failed to update save file in Google Drive.');
  }

  return (await res.json()) as DriveSaveFileMetadata;
}

export async function deleteSaveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    await handleDriveError(res, 'Failed to delete save file from Google Drive.');
  }
}
