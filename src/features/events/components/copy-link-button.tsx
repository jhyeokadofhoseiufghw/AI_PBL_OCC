"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path?: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={async () => {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href;
    await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  }} type="button">{copied ? "복사됨" : "공유 링크 복사"}</button>;
}
