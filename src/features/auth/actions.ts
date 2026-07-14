"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSql } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createOrganizerSession,
  deleteOrganizerSession,
  requireOrganizer,
} from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type AuthActionState = { error?: string };
export type OrganizerProfileState = { error?: string; success?: string };

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(72);

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(30),
  organizationName: z.string().trim().min(1).max(120),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function signUpOrganizer(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signUpSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
    name: value(formData, "name"),
    phone: value(formData, "phone"),
    organizationName: value(formData, "organizationName"),
  });
  if (!result.success)
    return {
      error: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };

  const sql = getSql();
  const existing =
    await sql`SELECT id FROM organizers WHERE email = ${result.data.email} LIMIT 1`;
  if (existing.length > 0) return { error: "이미 가입된 이메일입니다." };

  const passwordHash = await hashPassword(result.data.password);
  const rows = await sql`
    INSERT INTO organizers (email, password_hash, name, phone, organization_name)
    VALUES (${result.data.email}, ${passwordHash}, ${result.data.name}, ${result.data.phone}, ${result.data.organizationName})
    RETURNING id
  `;
  await createOrganizerSession(String(rows[0].id));
  redirect("/dashboard");
}

export async function signInOrganizer(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signInSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });
  if (!result.success) return { error: "이메일 또는 비밀번호를 확인해주세요." };
  if (!(await consumeRateLimit("organizer-login", result.data.email)))
    return { error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };

  const sql = getSql();
  const rows =
    await sql`SELECT id, password_hash FROM organizers WHERE email = ${result.data.email} LIMIT 1`;
  const organizer = rows[0];
  if (
    !organizer ||
    !(await verifyPassword(
      result.data.password,
      String(organizer.password_hash),
    ))
  ) {
    return { error: "이메일 또는 비밀번호를 확인해주세요." };
  }

  await createOrganizerSession(String(organizer.id));
  redirect("/dashboard");
}

export async function signOutOrganizer() {
  await deleteOrganizerSession();
  redirect("/login");
}

export async function updateOrganizerProfile(
  _: OrganizerProfileState,
  formData: FormData,
): Promise<OrganizerProfileState> {
  const session = await requireOrganizer();
  const result = signUpSchema.omit({ password: true }).safeParse({
    email: value(formData, "email"),
    name: value(formData, "name"),
    phone: value(formData, "phone"),
    organizationName: value(formData, "organizationName"),
  });
  if (!result.success)
    return {
      error: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };

  const sql = getSql();
  const duplicate = await sql`
    SELECT 1 FROM organizers
    WHERE email=${result.data.email} AND id<>${session.organizerId}
    LIMIT 1
  `;
  if (duplicate[0]) return { error: "이미 사용 중인 이메일입니다." };

  const rows = await sql`
    UPDATE organizers
    SET email=${result.data.email},name=${result.data.name},phone=${result.data.phone},organization_name=${result.data.organizationName}
    WHERE id=${session.organizerId}
    RETURNING id
  `;
  if (!rows[0]) return { error: "기획자 정보를 찾을 수 없습니다." };
  revalidatePath("/dashboard", "layout");
  return { success: "기획자 정보를 저장했습니다." };
}
