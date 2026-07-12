"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-red-700">
        요청을 처리하지 못했습니다.
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        잠시 후 다시 시도해주세요.
      </h1>
      <button
        className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        onClick={reset}
        type="button"
      >
        다시 시도
      </button>
    </main>
  );
}
