import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpOrganizer } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getOrganizerSession } from "@/lib/auth/session";

export default async function SignupPage() {
  if (await getOrganizerSession()) redirect("/dashboard");
  return <main className="mx-auto min-h-screen max-w-md px-6 py-12"><h1 className="text-2xl font-semibold">기획자 회원가입</h1><AuthForm action={signUpOrganizer} mode="signup" /><p className="mt-5 text-center text-sm text-zinc-600">이미 계정이 있나요? <Link className="font-medium text-emerald-700" href="/login">로그인</Link></p></main>;
}
