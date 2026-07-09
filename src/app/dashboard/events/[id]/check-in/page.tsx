import { CheckInScanner } from "@/features/checkin/components/check-in-scanner";

export default async function CheckInPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">QR 체크인</h1>
      <p className="mt-2 text-sm text-zinc-600">공연 ID: {id}</p>
      <div className="mt-6">
        <CheckInScanner />
      </div>
    </main>
  );
}
