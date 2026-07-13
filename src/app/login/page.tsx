import Link from "next/link";
import { redirect } from "next/navigation";

import { signInOrganizer } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getOrganizerSession } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await getOrganizerSession()) redirect("/dashboard");
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-12">
      <Link
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        href="/feed"
      >
        ← 공연 피드로 돌아가기
      </Link>
      <h1 className="mt-5 text-2xl font-semibold">기획자 로그인</h1>
      <AuthForm action={signInOrganizer} mode="login" />
      <p className="mt-5 text-center text-sm text-zinc-600">
        계정이 없나요?{" "}
        <Link className="font-medium text-emerald-700" href="/signup">
          회원가입
        </Link>
      </p>
    </main>
  );
}
