import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { LookupForm } from "@/features/reservations/components/lookup-form";
export default async function ReservationStatusPage({
  searchParams,
}: {
  searchParams: Promise<{
    event?: string;
    created?: string;
    waitlisted?: string;
  }>;
}) {
  const query = await searchParams;
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Link className="text-sm font-bold text-[#420093]" href="/feed">
          ← 공연 피드로 돌아가기
        </Link>
        <div className="mt-7 text-center">
          <p className="ha-kicker">Ticket status</p>
          <h1 className="ha-title mt-2 text-3xl sm:text-4xl">예매 승인 확인</h1>
          <p className="mt-3 text-[#60687a]">
            이름, 연락처, 조회 패스워드로 입금 승인 여부를 확인합니다.
          </p>
        </div>
        {query.created ? (
          <p className="mt-6 rounded-xl bg-[#e8fff5] p-4 text-sm text-[#006c4c]">
            예매 신청이 완료되었습니다. 입금 승인 후 예매번호와 QR을 확인할 수
            있습니다.
          </p>
        ) : null}
        {query.waitlisted ? (
          <p className="mt-6 rounded-xl bg-[#fff4d7] p-4 text-sm text-[#7a4f00]">
            대기 신청이 완료되었습니다.
          </p>
        ) : null}
        <LookupForm mode="status" />
      </main>
    </div>
  );
}
