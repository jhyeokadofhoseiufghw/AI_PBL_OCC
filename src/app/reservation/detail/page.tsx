import { LookupForm } from "@/features/reservations/components/lookup-form";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
export default function ReservationDetailPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Link className="text-sm font-bold text-[#420093]" href="/feed">
          ← 공연 피드로 돌아가기
        </Link>
        <div className="mt-7 text-center">
          <p className="ha-kicker">Admission pass</p>
          <h1 className="ha-title mt-2 text-3xl sm:text-4xl">예매 상세 조회</h1>
          <p className="mt-3 text-[#60687a]">
            승인된 예매의 상세 정보와 QR 티켓을 확인합니다.
          </p>
        </div>
        <LookupForm mode="detail" />
      </main>
    </div>
  );
}
