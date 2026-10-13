"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Saving...",
  className = ""
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-75`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : null}
        {pending ? pendingText : children}
      </span>
    </button>
  );
}
