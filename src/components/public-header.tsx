import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { signOutOrganizer } from "@/features/auth/actions";
import { getOrganizerSession } from "@/lib/auth/session";

export async function PublicHeader() {
  const signedIn = Boolean(await getOrganizerSession());

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb]/80 bg-white/85 backdrop-blur-xl">
      <div className="public-shell flex h-17 items-center justify-between gap-5">
        <Link
          className="flex items-center gap-2.5 font-extrabold tracking-tight text-[#250059]"
          href="/feed"
        >
          <BrandLogo />
          <span>Our Creative Catalyst</span>
        </Link>
        <nav
          className="flex items-center gap-2 text-sm max-sm:hidden sm:gap-5"
          aria-label="주요 메뉴"
        >
          <Link
            className="hidden text-[#4a4453] hover:text-[#420093] sm:inline"
            href="/reservation/status"
          >
            예매 조회
          </Link>
          {signedIn ? (
            <>
              <form action={signOutOrganizer}>
                <button
                  className="text-[#4a4453] hover:text-[#420093]"
                  type="submit"
                >
                  로그아웃
                </button>
              </form>
              <Link className="ha-button-primary px-3.5 py-2" href="/dashboard">
                공연 관리
              </Link>
            </>
          ) : (
            <>
              <Link
                className="hidden text-[#4a4453] hover:text-[#420093] sm:inline"
                href="/login"
              >
                로그인
              </Link>
              <Link className="ha-button-primary px-3.5 py-2" href="/signup">
                회원가입
              </Link>
            </>
          )}
        </nav>
        <details className="relative sm:hidden">
          <summary className="ha-button-primary cursor-pointer list-none px-3.5 py-2 text-sm">
            메뉴
          </summary>
          <nav
            className="ha-card absolute right-0 top-12 flex min-w-36 flex-col gap-1 p-2 text-sm shadow-xl"
            aria-label="모바일 주요 메뉴"
          >
            <Link
              className="rounded-lg px-3 py-2 text-[#4a4453] hover:bg-[#f7f5ff] hover:text-[#420093]"
              href="/reservation/status"
            >
              예매 조회
            </Link>
            {signedIn ? (
              <>
                <form action={signOutOrganizer}>
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-[#4a4453] hover:bg-[#f7f5ff] hover:text-[#420093]"
                    type="submit"
                  >
                    로그아웃
                  </button>
                </form>
                <Link
                  className="ha-button-primary px-3 py-2 text-center"
                  href="/dashboard"
                >
                  공연 관리
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="rounded-lg px-3 py-2 text-[#4a4453] hover:bg-[#f7f5ff] hover:text-[#420093]"
                  href="/login"
                >
                  로그인
                </Link>
                <Link
                  className="ha-button-primary px-3 py-2 text-center"
                  href="/signup"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
