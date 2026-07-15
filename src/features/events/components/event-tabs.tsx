import Link from "next/link";
import type { Route } from "next";
const tabs = [
  ["overview", "개요"],
  ["inquiry", "환불 및 문의"],
  ["seats", "좌석"],
  ["ticket-types", "티켓 타입"],
  ["feed", "피드"],
  ["promotion", "AI 피드"],
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
      className="mt-6 flex gap-1 overflow-x-auto border-b border-[#dfe3ec]"
      aria-label="공연 관리"
    >
      <>
        {tabs.map(([path, label]) => (
          <Link
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${current === path ? "border-[#712ae2] text-[#420093]" : "border-transparent text-[#60687a] hover:text-[#420093]"}`}
            href={`/dashboard/events/${eventId}/${path}` as Route}
            key={path}
          >
            {label}
          </Link>
        ))}
      </>
    </nav>
  );
}
