import Link from "next/link";

export function PublicHeader({ signedIn = false }: { signedIn?: boolean }) {
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
              <Link
                className="hidden text-[#4a4453] hover:text-[#420093] sm:inline"
                href="/dashboard"
              >
                공연 관리
              </Link>
              <Link
                className="ha-button-primary px-3.5 py-2"
                href="/dashboard/events/new"
              >
                공연 등록 신청
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
                기획자이신가요?
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
