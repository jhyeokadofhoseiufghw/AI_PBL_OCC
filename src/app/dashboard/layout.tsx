import Link from "next/link";

import { signOutOrganizer } from "@/features/auth/actions";
import { requireOrganizer } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrganizer();
  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link className="font-semibold text-emerald-800" href="/dashboard">
            OCC 운영
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-emerald-700" href="/feed">공연 피드</Link>
            <Link href="/dashboard/events">공연 목록</Link>
            <form action={signOutOrganizer}>
              <button className="text-zinc-600" type="submit">
                로그아웃
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
