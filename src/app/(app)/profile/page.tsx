import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { getProfileForUser } from "@/server/services/profile.service";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = {
  title: "پروفایل کاربری",
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user || user.isGuest || !user.passwordHash) {
    redirect("/login?from=/profile");
  }

  const data = await getProfileForUser(user.id);
  if (!data) {
    redirect("/login?from=/profile");
  }

  return <ProfileView data={data} />;
}
