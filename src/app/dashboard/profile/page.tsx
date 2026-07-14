import { notFound } from "next/navigation";

import { OrganizerProfileForm } from "@/features/auth/components/organizer-profile-form";
import { requireOrganizer } from "@/lib/auth/session";
import { getSql } from "@/lib/db/client";

export default async function OrganizerProfilePage() {
  const session = await requireOrganizer();
  const rows = await getSql()`
    SELECT email,name,phone,organization_name
    FROM organizers
    WHERE id=${session.organizerId}
    LIMIT 1
  `;
  const organizer = rows[0];
  if (!organizer) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="ha-kicker">Organizer profile</p>
      <h1 className="ha-title mt-1 text-3xl">기획자 정보</h1>
      <p className="mt-3 text-sm leading-6 text-[#60687a]">
        로그인 계정과 공연 페이지에 표시되는 기획자 정보를 관리합니다.
      </p>
      <OrganizerProfileForm
        organizer={{
          email: String(organizer.email),
          name: String(organizer.name),
          phone: String(organizer.phone),
          organizationName: String(organizer.organization_name),
        }}
      />
    </main>
  );
}
