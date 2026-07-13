import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/public-header";

import { signInOrganizer } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getOrganizerSession } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await getOrganizerSession()) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-6 py-12 sm:py-20">
        <p className="ha-kicker text-center">Organizer access</p>
        <h1 className="ha-title mt-2 text-center text-3xl">기획자 로그인</h1>
        <p className="mt-3 text-center text-sm text-[#60687a]">
          공연과 예매 운영 센터로 돌아오세요.
        </p>
        <AuthForm action={signInOrganizer} mode="login" />
        <p className="mt-5 text-center text-sm text-[#60687a]">
          계정이 없나요?{" "}
          <Link className="font-bold text-[#420093]" href="/signup">
            회원가입
          </Link>
        </p>
      </main>
    </div>
  );
}
