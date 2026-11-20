import { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  clearAccessToken,
  createSaveFile,
  deleteSaveFile,
  DriveAuthExpiredError,
  DriveSaveFileMetadata,
  DriveSavePayload,
  findSaveFile,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
  readSaveFile,
  updateSaveFile,
} from '../services/googleDriveSave';
import { ChecklistItem, SubjectKey } from '../types/checklist';

export interface DriveSavePreview {
  completed: number;
  total: number;
  updatedAt: string;
}

interface UseGoogleDriveSaveArgs {
  items: ChecklistItem[];
  activeSubject: SubjectKey;
  expandedUnits: Record<string, boolean>;
  onApplySavePayload: (payload: {
    items: ChecklistItem[];
    activeSubject?: SubjectKey;
    expandedUnits?: Record<string, boolean>;
  }) => void;
}

function buildItemsSignature(items: ChecklistItem[]): string {
  return items
    .map((item) => `${item.id}:${item.completed ? '1' : '0'}:${item.title}`)
    .join('|');
}

function summarizeItems(items: ChecklistItem[], updatedAt: string): DriveSavePreview {
  const valid = items.filter(
    (item) =>
      item &&
      (item.subject === 'physics' ||
        item.subject === 'chemistry' ||
        item.subject === 'maths')
  );
  return {
    completed: valid.filter((item) => item.completed).length,
    total: valid.length,
    updatedAt,
  };
}

export function useGoogleDriveSave({
  items,
  activeSubject,
  expandedUnits,
  onApplySavePayload,
}: UseGoogleDriveSaveArgs) {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveFile, setDriveFile] = useState<DriveSaveFileMetadata | null>(null);
  const [drivePreview, setDrivePreview] = useState<DriveSavePreview | null>(null);
  const [syncedSignature, setSyncedSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentSignature = useMemo(() => buildItemsSignature(items), [items]);
  const hasUnsavedChanges = useMemo(() => {
    if (needsAuth || !driveFile) return false;
    if (syncedSignature === null) return true;
    return syncedSignature !== currentSignature;
  }, [needsAuth, driveFile, syncedSignature, currentSignature]);

  const inspectDriveFile = useCallback(async (token: string) => {
    const file = await findSaveFile(token);
    setDriveFile(file);
    if (file) {
      try {
        const payload = await readSaveFile(token, file.id);
        setDrivePreview(summarizeItems(payload.items, payload.updatedAt));
      } catch {
        setDrivePreview(null);
      }
    } else {
      setDrivePreview(null);
    }
    return file;
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setNeedsAuth(false);
        void inspectDriveFile(token).catch(() => {
          // Silently ignore background check error; explicit sync will surface errors
        });
      },
      (rememberedUser) => {
        setUser(rememberedUser);
        setNeedsAuth(true);
        setDriveFile(null);
        setDrivePreview(null);
      }
    );
    return unsubscribe;
  }, [inspectDriveFile]);

  const handleOperationError = useCallback((err: unknown, fallback: string) => {
    if (err instanceof DriveAuthExpiredError) {
      clearAccessToken();
      setNeedsAuth(true);
      setErrorMessage(err.message);
      return;
    }
    if (err instanceof Error) {
      setErrorMessage(err.message);
      return;
    }
    setErrorMessage(fallback);
  }, []);

  const signIn = useCallback(async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setNeedsAuth(false);
      const found = await inspectDriveFile(result.accessToken);
      if (found) {
        setStatusMessage('Connected to Google Drive. Found your existing save file.');
      } else {
        setStatusMessage('Connected to Google Drive. Ready to create your save file.');
      }
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in was cancelled before completing.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage(
          'Sign-in popup was blocked by your browser. Allow popups and try again.'
        );
      } else {
        handleOperationError(err, 'Unable to sign in with Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [handleOperationError, inspectDriveFile]);

  const signOut = useCallback(async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setDriveFile(null);
    setDrivePreview(null);
    setSyncedSignature(null);
  }, []);

  const refreshDriveFile = useCallback(async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsSyncing(true);
    try {
      const file = await inspectDriveFile(token);
      setStatusMessage(
        file
          ? 'Drive save file metadata refreshed.'
          : 'No save file found in Google Drive yet.'
      );
    } catch (err) {
      handleOperationError(err, 'Could not refresh Google Drive save file.');
    } finally {
      setIsSyncing(false);
    }
  }, [handleOperationError, inspectDriveFile]);

  const buildPayload = useCallback((): DriveSavePayload => {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      activeSubject,
      expandedUnits,
      items,
    };
  }, [activeSubject, expandedUnits, items]);

  const createNewSave = useCallback(async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setErrorMessage('Please sign in with Google to save to Google Drive.');
      return;
    }

    setIsSyncing(true);
    try {
      const payload = buildPayload();
      const created = await createSaveFile(token, payload);
      setDriveFile(created);
      setDrivePreview(summarizeItems(payload.items, payload.updatedAt));
      setSyncedSignature(buildItemsSignature(payload.items));
      setStatusMessage('Save file created in your Google Drive.');
    } catch (err) {
      handleOperationError(err, 'Failed to create save file in Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  }, [buildPayload, handleOperationError]);

  const overwriteSave = useCallback(async () => {
    if (!driveFile) {
      await createNewSave();
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setErrorMessage('Please sign in with Google to update your Drive save file.');
      return;
    }

    setIsSyncing(true);
    try {
      const payload = buildPayload();
      const updated = await updateSaveFile(token, driveFile.id, payload);
      setDriveFile(updated);
      setDrivePreview(summarizeItems(payload.items, payload.updatedAt));
      setSyncedSignature(buildItemsSignature(payload.items));
      setStatusMessage('Google Drive save file updated.');
    } catch (err) {
      handleOperationError(err, 'Failed to update Google Drive save file.');
    } finally {
      setIsSyncing(false);
    }
  }, [buildPayload, createNewSave, driveFile, handleOperationError]);

  const loadSave = useCallback(async () => {
    if (!driveFile) return;
    setErrorMessage(null);
    setStatusMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setErrorMessage('Please sign in with Google to load your Drive save file.');
      return;
    }

    setIsSyncing(true);
    try {
      const payload = await readSaveFile(token, driveFile.id);
      onApplySavePayload(payload);
      setDrivePreview(summarizeItems(payload.items, payload.updatedAt));
      setSyncedSignature(buildItemsSignature(payload.items));
      setStatusMessage('Loaded checklist progress from Google Drive.');
    } catch (err) {
      handleOperationError(err, 'Failed to load save file from Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  }, [driveFile, handleOperationError, onApplySavePayload]);

  const deleteSave = useCallback(async () => {
    if (!driveFile) return;
    setErrorMessage(null);
    setStatusMessage(null);
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setErrorMessage('Please sign in with Google to delete your Drive save file.');
      return;
    }

    setIsSyncing(true);
    try {
      await deleteSaveFile(token, driveFile.id);
      setDriveFile(null);
      setDrivePreview(null);
      setSyncedSignature(null);
      setStatusMessage('Save file removed from Google Drive. Local progress kept.');
    } catch (err) {
      handleOperationError(err, 'Failed to delete Google Drive save file.');
    } finally {
      setIsSyncing(false);
    }
  }, [driveFile, handleOperationError]);

  const clearFeedback = useCallback(() => {
    setErrorMessage(null);
    setStatusMessage(null);
  }, []);

  return {
    user,
    needsAuth,
    isLoggingIn,
    isSyncing,
    driveFile,
    drivePreview,
    hasUnsavedChanges,
    errorMessage,
    statusMessage,
    signIn,
    signOut,
    refreshDriveFile,
    createNewSave,
    overwriteSave,
    loadSave,
    deleteSave,
    clearFeedback,
  };
}
