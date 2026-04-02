"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

type SafeDeleteModalProps = {
  open: boolean;
  projectTitle: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function SafeDeleteModal({
  open,
  projectTitle,
  isSubmitting = false,
  errorMessage,
  onCancel,
  onConfirm,
}: SafeDeleteModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");

  if (!open) {
    return null;
  }

  const canDelete = confirmationInput === projectTitle && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Permanently Delete
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Delete {projectTitle}?
            </h2>
            <p className="text-sm leading-6 text-zinc-400">
              This action cannot be undone. This will permanently delete the
              project JSON and its associated images.
            </p>
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (!canDelete) {
              return;
            }

            void onConfirm();
          }}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
            Please type <span className="font-semibold text-white">{projectTitle}</span>{" "}
            to confirm.
          </div>

          <label className="space-y-2 text-sm">
            <span className="block font-medium text-zinc-200">Confirmation</span>
            <input
              type="text"
              value={confirmationInput}
              onChange={(event) => setConfirmationInput(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/[0.07]"
              placeholder={projectTitle}
              autoFocus
              disabled={isSubmitting}
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canDelete}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-red-200/30 border-t-red-200" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "Deleting..." : "Permanently Delete"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
