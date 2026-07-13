import Link from "next/link";

import { signOutOrganizer } from "@/features/auth/actions";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

const nav = [
  ["/dashboard", "▦", "대시보드"],
  ["/dashboard/events", "◫", "공연 관리"],
  ["/dashboard/events/new", "+", "공연 생성"],
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOrganizer();
  const rows =
    await getSql()`SELECT name,organization_name FROM organizers WHERE id=${session.organizerId} LIMIT 1`;
  const organizer = rows[0];

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-[#2e1065] text-white lg:flex">
        <Link
          className="flex h-20 items-center gap-3 border-b border-white/10 px-6 text-lg font-extrabold"
          href="/dashboard"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xs text-[#2e1065]">
            HA
          </span>
          Homely Arts
        </Link>
        <nav className="flex-1 space-y-1 p-4" aria-label="운영 메뉴">
          {nav.map(([href, icon, label]) => (
            <Link
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#eaddff] transition hover:bg-white/10 hover:text-white"
              href={href}
              key={href}
            >
              <span className="grid h-7 w-7 place-items-center text-lg">
                {icon}
              </span>
              {label}
            </Link>
          ))}
          <div className="my-4 border-t border-white/10" />
          <Link
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#d3bbff] hover:bg-white/10"
            href="/feed"
          >
            <span className="grid h-7 w-7 place-items-center">↗</span>공개 공연
            피드
          </Link>
        </nav>
        <div className="border-t border-white/10 p-5">
          <p className="truncate text-sm font-bold">
            {String(organizer?.organization_name ?? "공연 기획자")}
          </p>
          <p className="mt-1 truncate text-xs text-[#d3bbff]">
            {String(organizer?.name ?? "Organizer")}
          </p>
          <form action={signOutOrganizer} className="mt-4">
            <button
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-left text-xs hover:bg-white/10"
              type="submit"
            >
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-main">
        <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-5 sm:px-8">
            <Link
              className="font-extrabold text-[#250059] lg:hidden"
              href="/dashboard"
            >
              Homely Arts Admin
            </Link>
            <p className="hidden text-sm font-semibold text-[#4a4453] lg:block">
              공연 운영 센터
            </p>
            <div className="flex items-center gap-3">
              <span className="ha-status hidden sm:inline-flex">
                System Operational
              </span>
              <Link
                className="text-sm text-[#4a4453] lg:hidden"
                href="/dashboard/events"
              >
                공연 목록
              </Link>
              <Link
                className="grid h-9 w-9 place-items-center rounded-full bg-[#ebddff] text-xs font-black text-[#420093]"
                href="/dashboard"
              >
                HA
              </Link>
            </div>
          </div>
          <nav
            className="flex gap-2 overflow-x-auto border-t border-[#e5e7eb] px-4 py-2 lg:hidden"
            aria-label="모바일 운영 메뉴"
          >
            {nav.map(([href, , label]) => (
              <Link
                className="whitespace-nowrap rounded-full bg-[#eff3ff] px-3 py-1.5 text-xs font-bold text-[#420093]"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
