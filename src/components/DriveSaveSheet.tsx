import { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CloudUpload,
  ExternalLink,
  FileJson,
  FolderDown,
  LogOut,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { DriveSavePreview } from '../hooks/useGoogleDriveSave';
import { DriveSaveFileMetadata, SAVE_FILE_NAME } from '../services/googleDriveSave';
import { SubjectStats } from '../types/checklist';
import { GoogleSignInButton } from './GoogleSignInButton';

interface DriveSaveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  isSyncing: boolean;
  driveFile: DriveSaveFileMetadata | null;
  drivePreview: DriveSavePreview | null;
  hasUnsavedChanges: boolean;
  localStats: SubjectStats;
  errorMessage: string | null;
  statusMessage: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onCreateSave: () => Promise<void>;
  onOverwriteSave: () => Promise<void>;
  onLoadSave: () => Promise<void>;
  onDeleteSave: () => Promise<void>;
  onClearFeedback: () => void;
}

type ConfirmAction = 'overwrite' | 'load' | 'delete' | null;

function formatTimestamp(iso?: string): string {
  if (!iso) return 'Unknown time';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DriveSaveSheet({
  isOpen,
  onClose,
  user,
  needsAuth,
  isLoggingIn,
  isSyncing,
  driveFile,
  drivePreview,
  hasUnsavedChanges,
  localStats,
  errorMessage,
  statusMessage,
  onSignIn,
  onSignOut,
  onRefresh,
  onCreateSave,
  onOverwriteSave,
  onLoadSave,
  onDeleteSave,
  onClearFeedback,
}: DriveSaveSheetProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setConfirmAction(null);
    onClearFeedback();
    onClose();
  };

  const handleExecuteConfirmed = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === 'overwrite') {
      await onOverwriteSave();
    } else if (action === 'load') {
      await onLoadSave();
    } else if (action === 'delete') {
      await onDeleteSave();
    }
  };

  const accountInitial =
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    'G';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#23211E]/40 dark:bg-[#0B100D]/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-save-sheet-title"
    >
      <div className="w-full sm:max-w-md max-h-[90dvh] flex flex-col bg-[#FAF6F0] dark:bg-[#1A251F] border-t sm:border border-[#DFD5C5] dark:border-[#2B3B32] rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#DFD5C5] dark:bg-[#2B3B32]" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#DFD5C5] dark:border-[#2B3B32] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E3EAD9] dark:bg-[#223228] border border-[#C3D0B8] dark:border-[#3A4E40] flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="drive-save-sheet-title"
                className="font-display text-lg font-semibold text-[#23211E] dark:text-[#F5F0E6] truncate"
              >
                Google Drive Save File
              </h2>
              <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] truncate">
                {needsAuth
                  ? 'Link your Google account to sync progress'
                  : `Linked to ${user?.email ?? 'Google Account'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Google Drive save dialog"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3]/60 dark:hover:bg-[#223028] transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto pb-safe">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl bg-[#F7EBE7] dark:bg-[#2C1C19] border border-[#DFC0B6] dark:border-[#5A332D] px-3.5 py-2.5 text-xs text-[#7D3C2E] dark:text-[#E59485]"
            >
              {errorMessage}
            </div>
          )}

          {statusMessage && !errorMessage && (
            <div
              role="status"
              className="rounded-xl bg-[#E3EAD9]/75 dark:bg-[#223228] border border-[#C3D0B8] dark:border-[#3A4E40] px-3.5 py-2.5 text-xs text-[#2F3E2B] dark:text-[#D5E3D7]"
            >
              {statusMessage}
            </div>
          )}

          {/* Account Card */}
          {needsAuth ? (
            <div className="rounded-2xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-4 space-y-3">
              {user ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#23211E] dark:text-[#F5F0E6]">
                    Reconnect {user.email ?? 'your Google account'}
                  </p>
                  <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] leading-relaxed">
                    For security, Google Drive permissions expire when the page reloads. Sign in with Google to access or update your save file.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#23211E] dark:text-[#F5F0E6]">
                    Link your Google Account
                  </p>
                  <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] leading-relaxed">
                    Creates a dedicated <span className="font-mono text-[#23211E] dark:text-[#F5F0E6]">{SAVE_FILE_NAME}</span> save file in your Google Drive so you can back up and restore your PCM checklist across devices.
                  </p>
                </div>
              )}

              <GoogleSignInButton
                onClick={onSignIn}
                disabled={isLoggingIn}
                label={
                  isLoggingIn
                    ? 'Connecting...'
                    : user
                    ? 'Reconnect with Google'
                    : 'Sign in with Google'
                }
              />

              {user && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full min-h-[40px] rounded-xl text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3]/60 dark:hover:bg-[#223028] inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Unlink account</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Connected Account Header */}
              <div className="rounded-2xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? 'Google profile'}
                      className="w-9 h-9 rounded-full border border-[#DFD5C5] dark:border-[#2B3B32] object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#556B4F] dark:bg-[#8FA993] text-[#FAF6F0] dark:text-[#131B17] text-sm font-semibold flex items-center justify-center shrink-0">
                      {accountInitial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] truncate">
                      {user?.displayName || 'Google Account'}
                    </div>
                    <div className="text-xs text-[#6B645B] dark:text-[#A8B5AA] truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  disabled={isSyncing}
                  className="min-h-[38px] px-3 rounded-xl border border-[#DFD5C5] dark:border-[#2B3B32] bg-[#FAF6F0] dark:bg-[#1A251F] text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>

              {/* Linked Drive Save File Status */}
              <div className="rounded-2xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileJson
                      className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] truncate">
                        {SAVE_FILE_NAME}
                      </div>
                      {driveFile ? (
                        <div className="mt-1 space-y-0.5 text-xs text-[#6B645B] dark:text-[#A8B5AA]">
                          <div>
                            Last saved {formatTimestamp(driveFile.modifiedTime)}
                          </div>
                          {drivePreview && (
                            <div className="font-mono text-[11px] text-[#556B4F] dark:text-[#8FA993] tabular-nums">
                              Cloud save: {drivePreview.completed} / {drivePreview.total} topics done
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-[#6B645B] dark:text-[#A8B5AA] leading-relaxed">
                          No save file in your Google Drive yet. Create one to store your current progress ({localStats.completed} / {localStats.total} topics done).
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isSyncing}
                    aria-label="Refresh Drive save file status"
                    className="min-w-[38px] min-h-[38px] rounded-xl border border-[#DFD5C5] dark:border-[#2B3B32] bg-[#FAF6F0] dark:bg-[#1A251F] text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center justify-center transition-colors shrink-0"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div className="pt-2 border-t border-[#DFD5C5] dark:border-[#2B3B32] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#6B645B] dark:text-[#A8B5AA] font-mono tabular-nums">
                    Local: {localStats.completed} / {localStats.total} ({localStats.percentage}%)
                  </span>
                  {driveFile && (
                    <span
                      className={`font-medium ${
                        hasUnsavedChanges
                          ? 'text-[#8C5B32] dark:text-[#E2B488]'
                          : 'text-[#556B4F] dark:text-[#8FA993]'
                      }`}
                    >
                      {hasUnsavedChanges ? 'Unsaved local changes' : 'In sync'}
                    </span>
                  )}
                </div>

                {driveFile?.webViewLink && (
                  <a
                    href={driveFile.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#556B4F] dark:text-[#8FA993] hover:underline"
                  >
                    <span>View save file in Google Drive</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </div>

              {/* Explicit Confirmation Panel or Actions */}
              {confirmAction !== null ? (
                <div className="rounded-2xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#C3D0B8] dark:border-[#3A4E40] p-4 space-y-3">
                  <p className="text-sm font-medium text-[#23211E] dark:text-[#F5F0E6]">
                    {confirmAction === 'overwrite' &&
                      `Overwrite "${SAVE_FILE_NAME}" in Google Drive?`}
                    {confirmAction === 'load' &&
                      `Load "${SAVE_FILE_NAME}" from Google Drive?`}
                    {confirmAction === 'delete' &&
                      `Delete "${SAVE_FILE_NAME}" from Google Drive?`}
                  </p>
                  <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] leading-relaxed">
                    {confirmAction === 'overwrite' &&
                      `This will replace your cloud save from ${formatTimestamp(
                        driveFile?.modifiedTime
                      )} with your current local checklist (${localStats.completed} / ${
                        localStats.total
                      } topics done).`}
                    {confirmAction === 'load' &&
                      `This will replace your local checklist (${localStats.completed} / ${
                        localStats.total
                      } topics) with your cloud save from ${formatTimestamp(
                        driveFile?.modifiedTime
                      )}${
                        drivePreview
                          ? ` (${drivePreview.completed} / ${drivePreview.total} topics done)`
                          : ''
                      }.`}
                    {confirmAction === 'delete' &&
                      'This permanently removes the save file from your Google Drive. Your local checklist on this device will remain untouched.'}
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      disabled={isSyncing}
                      className="min-h-[44px] px-4 rounded-xl border border-[#DFD5C5] dark:border-[#2B3B32] bg-[#FAF6F0] dark:bg-[#1A251F] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteConfirmed}
                      disabled={isSyncing}
                      className={`min-h-[44px] px-4 rounded-xl text-sm font-medium transition-colors ${
                        confirmAction === 'delete'
                          ? 'bg-[#8D4334] dark:bg-[#B85643] text-[#FAF6F0] hover:bg-[#753629] dark:hover:bg-[#9E4635]'
                          : 'bg-[#556B4F] dark:bg-[#8FA993] text-[#FAF6F0] dark:text-[#131B17] hover:bg-[#465941] dark:hover:bg-[#A2BA9F]'
                      }`}
                    >
                      {confirmAction === 'overwrite' && 'Confirm Overwrite'}
                      {confirmAction === 'load' && 'Confirm Load'}
                      {confirmAction === 'delete' && 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {!driveFile ? (
                    <button
                      type="button"
                      onClick={onCreateSave}
                      disabled={isSyncing}
                      className="w-full min-h-[46px] px-4 rounded-xl bg-[#556B4F] dark:bg-[#8FA993] text-sm font-medium text-[#FAF6F0] dark:text-[#131B17] hover:bg-[#465941] dark:hover:bg-[#A2BA9F] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <CloudUpload className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {isSyncing ? 'Creating Save File...' : 'Create Save File in Google Drive'}
                      </span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmAction('overwrite')}
                        disabled={isSyncing}
                        className="w-full min-h-[46px] px-4 rounded-xl bg-[#556B4F] dark:bg-[#8FA993] text-sm font-medium text-[#FAF6F0] dark:text-[#131B17] hover:bg-[#465941] dark:hover:bg-[#A2BA9F] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <CloudUpload className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {isSyncing ? 'Syncing...' : 'Save Current Progress to Drive'}
                        </span>
                      </button>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setConfirmAction('load')}
                          disabled={isSyncing}
                          className="min-h-[44px] px-3.5 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                          <FolderDown className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
                          <span>Load from Drive</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmAction('delete')}
                          disabled={isSyncing}
                          className="min-h-[44px] px-3.5 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#7D3C2E] dark:text-[#E59485] hover:bg-[#F7EBE7] dark:hover:bg-[#2C1C19] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Delete Save</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
