"use client";
import { useRouter } from "next/navigation";
export function EventSwitcher({
  current,
  events,
}: {
  current: string;
  events: { id: string; title: string }[];
}) {
  const router = useRouter();
  return (
    <select
      aria-label="관리 공연 선택"
      className="rounded-lg border px-3 py-2"
      value={current}
      onChange={(event) =>
        router.push(`/dashboard/events/${event.target.value}/reservations`)
      }
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.title}
        </option>
      ))}
    </select>
  );
}
