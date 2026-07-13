import Link from "next/link";
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
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        href="/feed"
      >
        ← 공연 피드로 돌아가기
      </Link>
      <h1 className="mt-5 text-2xl font-semibold text-zinc-950">
        예매 승인 확인
      </h1>
      <p className="mt-3 text-zinc-600">
        이름, 연락처, 조회 패스워드로 입금 승인 여부를 확인합니다.
      </p>
      {query.created ? (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          예매 신청이 완료되었습니다. 입금 승인 후 예매번호와 QR을 확인할 수
          있습니다.
        </p>
      ) : null}
      {query.waitlisted ? (
        <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          대기 신청이 완료되었습니다.
        </p>
      ) : null}
      <LookupForm mode="status" />
    </main>
  );
}
