"use client";

import { useState, useTransition } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

type ScanState =
  | { status: "idle"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function CheckInScanner() {
  const [paused, setPaused] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({
    status: "idle",
    message: "QR을 카메라 프레임 안에 맞춰주세요."
  });
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black">
        <Scanner
          paused={paused || isPending}
          allowMultiple={false}
          constraints={{ facingMode: "environment", aspectRatio: 1 }}
          formats={["qr_code"]}
          onScan={(results) => {
            const qrToken = results[0]?.rawValue;
            if (!qrToken) return;

            setPaused(true);
            setScanState({ status: "idle", message: "체크인 처리 중입니다." });

            startTransition(async () => {
              // TODO: replace with checkInByQr Server Action.
              await new Promise((resolve) => setTimeout(resolve, 300));
              setScanState({
                status: "success",
                message: `QR 인식 성공: ${qrToken}`
              });
            });
          }}
          onError={(error) => {
            setScanState({
              status: "error",
              message: error instanceof Error ? error.message : "카메라를 사용할 수 없습니다."
            });
          }}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className={scanState.status === "error" ? "text-sm text-red-700" : "text-sm text-zinc-700"}>
          {scanState.message}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isPending}
          onClick={() => {
            setPaused(false);
            setScanState({ status: "idle", message: "다음 QR을 스캔할 수 있습니다." });
          }}
        >
          다시 스캔
        </button>
      </div>
    </section>
  );
}
