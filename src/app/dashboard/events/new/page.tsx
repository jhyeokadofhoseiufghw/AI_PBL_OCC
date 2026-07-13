import { NewEventForm } from "@/features/events/components/new-event-form";

export default function NewEventPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ha-kicker">Create show</p>
          <h1 className="ha-title mt-1 text-3xl">공연 생성</h1>
          <p className="mt-3 text-[#60687a]">
            공연 기본 정보와 기본 가격, 티켓 등급별 가격을 입력합니다.
          </p>
        </div>
        <span className="rounded-full bg-[#fff4d7] px-4 py-2 text-sm font-bold text-[#7a4f00]">
          ● 작성 중
        </span>
      </div>
      <div className="mt-7 flex items-center gap-3 text-sm font-bold">
        <span className="rounded-full bg-[#420093] px-4 py-2 text-white">
          1 &nbsp; 기본 정보 및 정책
        </span>
        <span className="h-px w-8 bg-[#ccc3d6]" />
        <span className="text-[#60687a]">2 &nbsp; 좌석 배치 지정</span>
      </div>
      <NewEventForm />
    </main>
  );
}
