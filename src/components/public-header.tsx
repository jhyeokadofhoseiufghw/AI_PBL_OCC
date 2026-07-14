import Link from "next/link";

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
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#250059] text-sm text-white shadow-sm">
            HA
          </span>
          <span>Homely Arts</span>
        </Link>
        <nav
          className="flex items-center gap-2 text-sm sm:gap-5"
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
      </div>
    </header>
  );
}
