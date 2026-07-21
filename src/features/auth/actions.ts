"use server";

import { createHmac, randomInt } from "node:crypto";
import { del } from "@vercel/blob";
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

export type AuthActionState = { error?: string; success?: string };
export type OrganizerProfileState = { error?: string; success?: string };
export type DeleteOrganizerState = { error?: string };

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
  verificationCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "이메일로 받은 인증번호 6자리를 입력해주세요."),
  password: passwordSchema,
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(30),
  organizationName: z.string().trim().min(1).max(120),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

const profileSchema = z.object({
  email: emailSchema,
  verificationCode: z.string().trim(),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(30),
  organizationName: z.string().trim().min(1).max(120),
});

const deleteOrganizerSchema = z.object({
  password: z.string().min(1).max(72),
  confirmation: z.literal("탈퇴합니다"),
});

const resetPasswordSchema = z
  .object({
    email: emailSchema,
    verificationCode: z.string().regex(/^\d{6}$/),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "새 비밀번호가 서로 일치하지 않습니다.",
    path: ["passwordConfirmation"],
  });

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function verificationCodeHash(email: string, code: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

async function issueEmailVerificationCode(
  email: string,
): Promise<AuthActionState> {
  if (!process.env.RESEND_API_KEY)
    return { error: "이메일 발송 설정이 완료되지 않았습니다." };
  const sql = getSql();
  const code = String(randomInt(100000, 1000000));
  const codeHash = verificationCodeHash(email, code);
  const stored = await sql`
    INSERT INTO email_verification_codes (
      email,code_hash,expires_at,attempts,last_sent_at,used_at,updated_at
    ) VALUES (${email},${codeHash},NOW()+INTERVAL '5 minutes',0,NOW(),NULL,NOW())
    ON CONFLICT(email) DO UPDATE SET
      code_hash=EXCLUDED.code_hash,
      expires_at=EXCLUDED.expires_at,
      attempts=0,
      last_sent_at=NOW(),
      used_at=NULL,
      updated_at=NOW()
    WHERE email_verification_codes.last_sent_at <= NOW()-INTERVAL '60 seconds'
    RETURNING email
  `;
  if (!stored[0]) return { error: "인증번호는 60초 후에 다시 요청할 수 있습니다." };

  let sent = false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "OCC <no-reply@occ.pics>",
        to: [email],
        subject: "[OCC] 이메일 인증번호",
        text: `OCC 이메일 인증번호는 ${code}입니다. 인증번호는 5분 동안 유효합니다.`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>OCC 이메일 인증</h2><p>아래 인증번호를 화면에 입력해주세요.</p><p style="font-size:30px;font-weight:700;letter-spacing:6px">${code}</p><p>인증번호는 5분 동안 유효합니다.</p></div>`,
      }),
    });
    sent = response.ok;
  } catch {
    sent = false;
  }
  if (!sent) {
    await sql`DELETE FROM email_verification_codes WHERE email=${email} AND code_hash=${codeHash}`;
    return { error: "인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요." };
  }
  return { success: "인증번호를 보냈습니다. 메일함과 스팸함을 확인해주세요." };
}

export async function sendEmailVerificationCode(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedEmail = emailSchema.safeParse(value(formData, "email"));
  if (!parsedEmail.success) return { error: "올바른 이메일을 입력해주세요." };

  const email = parsedEmail.data;
  if (!(await consumeRateLimit("email-verification-send", email, 4)))
    return { error: "인증번호 요청이 너무 많습니다. 15분 후 다시 시도해주세요." };

  const sql = getSql();
  const existing = await sql`SELECT 1 FROM organizers WHERE email=${email} LIMIT 1`;
  if (existing[0])
    return {
      error: "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.",
    };

  return issueEmailVerificationCode(email);
}

export async function sendPasswordResetCode(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedEmail = emailSchema.safeParse(value(formData, "email"));
  if (!parsedEmail.success) return { error: "올바른 이메일을 입력해주세요." };
  const email = parsedEmail.data;
  if (!(await consumeRateLimit("password-reset-send", email, 4)))
    return { error: "인증번호 요청이 너무 많습니다. 15분 후 다시 시도해주세요." };
  const existing = await getSql()`SELECT 1 FROM organizers WHERE email=${email} LIMIT 1`;
  if (!existing[0])
    return {
      success: "가입된 이메일이라면 인증번호를 보냈습니다. 메일함을 확인해주세요.",
    };
  return issueEmailVerificationCode(email);
}

export async function resetOrganizerPassword(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = resetPasswordSchema.safeParse({
    email: value(formData, "email"),
    verificationCode: value(formData, "verificationCode"),
    password: value(formData, "password"),
    passwordConfirmation: value(formData, "passwordConfirmation"),
  });
  if (!result.success)
    return {
      error: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  if (!(await consumeRateLimit("password-reset", result.data.email, 6)))
    return { error: "재설정 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };

  const passwordHash = await hashPassword(result.data.password);
  const codeHash = verificationCodeHash(
    result.data.email,
    result.data.verificationCode,
  );
  const rows = await getSql()`
    WITH verification AS (
      UPDATE email_verification_codes
      SET attempts=attempts+1,
          used_at=CASE WHEN code_hash=${codeHash} THEN NOW() ELSE used_at END,
          updated_at=NOW()
      WHERE email=${result.data.email}
        AND used_at IS NULL
        AND expires_at > NOW()
        AND attempts < 5
      RETURNING code_hash=${codeHash} AS valid
    )
    UPDATE organizers
    SET password_hash=${passwordHash}
    FROM verification
    WHERE organizers.email=${result.data.email} AND verification.valid
    RETURNING organizers.id
  `;
  if (!rows[0])
    return {
      error: "인증번호가 올바르지 않거나 만료되었습니다. 다시 확인해주세요.",
    };
  redirect("/login?reset=1");
}

export async function signUpOrganizer(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signUpSchema.safeParse({
    email: value(formData, "email"),
    verificationCode: value(formData, "verificationCode"),
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
  const codeHash = verificationCodeHash(
    result.data.email,
    result.data.verificationCode,
  );
  const rows = await sql`
    WITH verification AS (
      UPDATE email_verification_codes
      SET attempts=attempts+1,
          used_at=CASE WHEN code_hash=${codeHash} THEN NOW() ELSE used_at END,
          updated_at=NOW()
      WHERE email=${result.data.email}
        AND used_at IS NULL
        AND expires_at > NOW()
        AND attempts < 5
      RETURNING code_hash=${codeHash} AS valid
    ), inserted AS (
      INSERT INTO organizers (email,password_hash,name,phone,organization_name)
      SELECT ${result.data.email},${passwordHash},${result.data.name},${result.data.phone},${result.data.organizationName}
      FROM verification WHERE valid
      RETURNING id
    )
    SELECT id FROM inserted
  `;
  if (!rows[0])
    return {
      error: "인증번호가 올바르지 않거나 만료되었습니다. 다시 확인해주세요.",
    };
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
  const result = profileSchema.safeParse({
    email: value(formData, "email"),
    verificationCode: value(formData, "verificationCode"),
    name: value(formData, "name"),
    phone: value(formData, "phone"),
    organizationName: value(formData, "organizationName"),
  });
  if (!result.success)
    return {
      error: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };

  const sql = getSql();
  const currentRows = await sql`
    SELECT email FROM organizers WHERE id=${session.organizerId} LIMIT 1
  `;
  const current = currentRows[0];
  if (!current) return { error: "기획자 정보를 찾을 수 없습니다." };
  const emailChanged = String(current.email) !== result.data.email;

  const duplicate = await sql`
    SELECT 1 FROM organizers
    WHERE email=${result.data.email} AND id<>${session.organizerId}
    LIMIT 1
  `;
  if (duplicate[0]) return { error: "이미 사용 중인 이메일입니다." };

  let rows;
  if (emailChanged) {
    if (!/^\d{6}$/.test(result.data.verificationCode))
      return { error: "새 이메일로 받은 인증번호 6자리를 입력해주세요." };
    const codeHash = verificationCodeHash(
      result.data.email,
      result.data.verificationCode,
    );
    rows = await sql`
      WITH verification AS (
        UPDATE email_verification_codes
        SET attempts=attempts+1,
            used_at=CASE WHEN code_hash=${codeHash} THEN NOW() ELSE used_at END,
            updated_at=NOW()
        WHERE email=${result.data.email}
          AND used_at IS NULL
          AND expires_at > NOW()
          AND attempts < 5
        RETURNING code_hash=${codeHash} AS valid
      )
      UPDATE organizers
      SET email=${result.data.email},name=${result.data.name},phone=${result.data.phone},organization_name=${result.data.organizationName}
      FROM verification
      WHERE id=${session.organizerId} AND verification.valid
      RETURNING id
    `;
    if (!rows[0])
      return {
        error: "인증번호가 올바르지 않거나 만료되었습니다. 다시 확인해주세요.",
      };
  } else {
    rows = await sql`
      UPDATE organizers
      SET name=${result.data.name},phone=${result.data.phone},organization_name=${result.data.organizationName}
      WHERE id=${session.organizerId}
      RETURNING id
    `;
  }
  if (!rows[0]) return { error: "기획자 정보를 찾을 수 없습니다." };
  revalidatePath("/dashboard", "layout");
  return { success: "기획자 정보를 저장했습니다." };
}

export async function deleteOrganizerAccount(
  _: DeleteOrganizerState,
  formData: FormData,
): Promise<DeleteOrganizerState> {
  const session = await requireOrganizer();
  const result = deleteOrganizerSchema.safeParse({
    password: value(formData, "password"),
    confirmation: value(formData, "confirmation"),
  });
  if (!result.success)
    return { error: "현재 비밀번호와 ‘탈퇴합니다’ 문구를 정확히 입력해주세요." };
  if (!(await consumeRateLimit("organizer-delete", session.organizerId, 5)))
    return { error: "확인 시도가 너무 많습니다. 15분 후 다시 시도해주세요." };

  const sql = getSql();
  const rows = await sql`
    SELECT password_hash,email FROM organizers WHERE id=${session.organizerId} LIMIT 1
  `;
  if (
    !rows[0] ||
    !(await verifyPassword(
      result.data.password,
      String(rows[0].password_hash),
    ))
  )
    return { error: "현재 비밀번호가 올바르지 않습니다." };

  const assetRows = await sql`
    SELECT poster_image_url AS url FROM events WHERE organizer_id=${session.organizerId}
    UNION ALL
    SELECT detail_image_url AS url FROM events WHERE organizer_id=${session.organizerId}
    UNION ALL
    SELECT fp.image_url AS url
    FROM feed_posts fp JOIN events e ON e.id=fp.event_id
    WHERE e.organizer_id=${session.organizerId}
  `;
  const [deleted] = await sql.transaction((tx) => [
    tx`DELETE FROM organizers WHERE id=${session.organizerId} RETURNING id`,
    tx`DELETE FROM email_verification_codes WHERE email=${String(rows[0].email)} RETURNING email`,
  ]);
  if (!deleted[0]) return { error: "계정을 찾을 수 없습니다." };
  const blobUrls = [
    ...new Set(
      assetRows
        .map((row) => String(row.url ?? ""))
        .filter((url) => {
          try {
            return new URL(url).hostname.endsWith(
              ".public.blob.vercel-storage.com",
            );
          } catch {
            return false;
          }
        }),
    ),
  ];
  if (blobUrls.length) {
    try {
      await del(blobUrls);
    } catch {
      // The account and private database records are already removed. Blob
      // cleanup is best-effort so a storage outage cannot restore the account.
    }
  }
  await deleteOrganizerSession();
  redirect("/");
}
