import { NewEventForm } from "@/features/events/components/new-event-form";

export default function NewEventPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">공연 생성</h1>
      <p className="mt-3 text-zinc-600">
        공연 기본 정보와 기본 가격, 티켓 등급별 가격을 입력합니다.
      </p>
      <NewEventForm />
    </main>
  );
}
