import Link from "next/link";
const tabs = [
  ["overview", "개요"],
  ["seats", "좌석"],
  ["ticket-types", "티켓 타입"],
  ["feed", "피드"],
  ["reservations", "예매"],
  ["check-in", "체크인"],
] as const;
export function EventTabs({
  eventId,
  current,
}: {
  eventId: string;
  current: string;
}) {
  return (
    <nav
      className="mt-6 flex gap-1 overflow-x-auto border-b"
      aria-label="공연 관리"
    >
      <>
        {tabs.map(([path, label]) => (
          <Link
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${current === path ? "border-emerald-700 font-medium text-emerald-800" : "border-transparent text-zinc-500"}`}
            href={`/dashboard/events/${eventId}/${path}`}
            key={path}
          >
            {label}
          </Link>
        ))}
      </>
    </nav>
  );
}
