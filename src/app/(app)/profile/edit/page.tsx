import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditClient } from "@/components/profile/ProfileEditClient";
import { getProfileForUser } from "@/server/services/profile.service";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = {
  title: "ویرایش پروفایل | حرفچین",
};

export default async function ProfileEditPage() {
  const user = await getSessionUser();
  if (!user?.email || user.isGuest || !user.passwordHash) {
    redirect("/login?from=/profile/edit");
  }

  const data = await getProfileForUser(user.id);
  if (!data) {
    redirect("/login?from=/profile/edit");
  }

  return (
    <ProfileEditClient
      initialName={data.user.name ?? ""}
      email={data.user.email ?? ""}
    />
  );
}
