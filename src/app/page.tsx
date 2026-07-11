import Link from "next/link";

const routes = [
  { href: "/feed", label: "홈 피드" },
  { href: "/reservation/status", label: "예매 승인 확인" },
  { href: "/reservation/detail", label: "예매 상세 조회" },
  { href: "/dashboard", label: "기획자 대시보드" },
  { href: "/login", label: "기획자 로그인" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="space-y-3">
        <p className="text-sm font-medium text-emerald-700">OCC</p>
        <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
          소규모 공연 예매 및 QR 체크인 운영 플랫폼
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600">
          공연 생성, 비회원 예매, 수동 입금 승인, QR 발급, 휴대폰 카메라 체크인을 연결하는 MVP 개발 환경입니다.
        </p>
      </header>

      <nav className="grid gap-3 sm:grid-cols-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700"
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
