"use client";

import { useState } from "react";

type CommitModalProps = {
  open: boolean;
  defaultMessage: string;
  errorMessage?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (message: string) => void | Promise<void>;
};

export function CommitModal({
  open,
  defaultMessage,
  errorMessage,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: CommitModalProps) {
  const [message, setMessage] = useState(defaultMessage);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Deploy Changes
          </p>
          <h2 className="text-2xl font-semibold text-white">Commit and Push</h2>
          <p className="text-sm leading-6 text-zinc-400">
            Review the commit message, then push to GitHub to trigger a Vercel
            deployment.
          </p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(message);
          }}
        >
          <label className="space-y-2 text-sm">
            <span className="block font-medium text-zinc-200">Commit Message</span>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/[0.07]"
              placeholder="Update project content"
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
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : null}
              <span>{isSubmitting ? "Pushing..." : "Push to Vercel"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
