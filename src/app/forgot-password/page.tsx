import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicHeader } from "@/components/public-header";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";
import { getOrganizerSession } from "@/lib/auth/session";

export default async function ForgotPasswordPage() {
  if (await getOrganizerSession()) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-12 sm:py-20">
        <p className="ha-kicker text-center">Password recovery</p>
        <h1 className="ha-title mt-2 text-center text-3xl">
          기획자 비밀번호 재설정
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-[#60687a]">
          가입 이메일 인증 후 새 비밀번호를 설정할 수 있습니다.
        </p>
        <PasswordResetForm />
        <p className="mt-5 text-center text-sm text-[#60687a]">
          비밀번호가 기억났나요?{" "}
          <Link className="font-bold text-[#420093]" href="/login">
            로그인
          </Link>
        </p>
      </main>
    </div>
  );
}
