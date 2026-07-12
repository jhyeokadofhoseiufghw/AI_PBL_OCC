"use client";

import { useEffect, useState, useTransition } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { checkInByQr, type CheckInResult } from "../actions";

type ScanState =
  CheckInResult | { status: "idle"; message: string; checkedInAt?: undefined };

export function CheckInScanner({ eventId }: { eventId: string }) {
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<ScanState>({
    status: "idle",
    message: "QR을 카메라 프레임 안에 맞춰주세요.",
  });
  const [isPending, startTransition] = useTransition();
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) =>
        setCameras(devices.filter((device) => device.kind === "videoinput")),
      )
      .catch(() => undefined);
  }, []);

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-black">
        <Scanner
          paused={paused || isPending}
          allowMultiple={false}
          constraints={
            deviceId
              ? { deviceId: { exact: deviceId }, aspectRatio: 1 }
              : { facingMode: "environment", aspectRatio: 1 }
          }
          formats={["qr_code"]}
          onScan={(results) => {
            const token = results[0]?.rawValue;
            if (!token) return;
            setPaused(true);
            setState({ status: "idle", message: "체크인 처리 중입니다." });
            startTransition(async () =>
              setState(await checkInByQr(eventId, token)),
            );
          }}
          onError={(error) => {
            const raw =
              error instanceof Error
                ? error.message
                : "카메라를 사용할 수 없습니다.";
            const message =
              location.protocol !== "https:" &&
              location.hostname !== "localhost"
                ? "카메라는 HTTPS 환경에서만 사용할 수 있습니다."
                : /permission|denied|notallowed/i.test(raw)
                  ? "카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
                  : raw;
            setPaused(true);
            setState({ status: "error", message });
          }}
        />
      </div>
      {cameras.length > 1 ? (
        <label className="block text-sm font-medium">
          카메라 선택
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={deviceId}
            onChange={(event) => {
              setDeviceId(event.target.value);
              setPaused(false);
            }}
          >
            <option value="">후면 카메라 우선</option>
            {cameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `카메라 ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div
        className={`rounded-xl border p-4 ${state.status === "success" ? "border-emerald-200 bg-emerald-50" : state.status === "duplicate" ? "border-amber-200 bg-amber-50" : state.status === "error" ? "border-red-200 bg-red-50" : "bg-white"}`}
      >
        <p className="font-medium">{state.message}</p>
        {state.checkedInAt ? (
          <p className="mt-1 text-sm text-zinc-600">
            완료 시각 {new Date(state.checkedInAt).toLocaleString("ko-KR")}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-400"
          disabled={isPending}
          onClick={() => {
            setPaused(false);
            setState({
              status: "idle",
              message: "다음 QR을 스캔할 수 있습니다.",
            });
          }}
        >
          다음 QR 스캔
        </button>
      </div>
    </section>
  );
}
