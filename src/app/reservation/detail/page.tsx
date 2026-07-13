import { LookupForm } from "@/features/reservations/components/lookup-form";
export default function ReservationDetailPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">예매 상세 조회</h1>
      <p className="mt-3 text-zinc-600">
        승인된 예매의 상세 정보와 QR 티켓을 확인합니다.
      </p>
      <LookupForm mode="detail" />
    </main>
  );
}
