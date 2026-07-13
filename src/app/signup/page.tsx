import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/public-header";

import { signUpOrganizer } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getOrganizerSession } from "@/lib/auth/session";

export default async function SignupPage() {
  if (await getOrganizerSession()) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-12 sm:py-20">
        <p className="ha-kicker text-center">Start your stage</p>
        <h1 className="ha-title mt-2 text-center text-3xl">기획자 회원가입</h1>
        <p className="mt-3 text-center text-sm text-[#60687a]">
          작은 무대를 더 많은 관객에게 연결하세요.
        </p>
        <AuthForm action={signUpOrganizer} mode="signup" />
        <p className="mt-5 text-center text-sm text-[#60687a]">
          이미 계정이 있나요?{" "}
          <Link className="font-bold text-[#420093]" href="/login">
            로그인
          </Link>
        </p>
      </main>
    </div>
  );
}
