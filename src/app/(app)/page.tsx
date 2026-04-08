import { HomeDashboard } from "@/components/home/HomeDashboard";
import * as roomService from "@/server/services/room.service";
import { getProfileForUser } from "@/server/services/profile.service";
import { getSessionUser } from "@/server/session";

export default async function HomePage() {
  const user = await getSessionUser();
  const profile =
    user && !user.isGuest && user.email && user.passwordHash
      ? await getProfileForUser(user.id)
      : null;

  const rooms = await roomService.listRoomsForDirectory();
  const previewRooms = rooms.slice(0, 3);

  const greetName =
    profile?.user.name?.trim().split(/\s+/)[0] ??
    user?.name?.trim().split(/\s+/)[0] ??
    (user?.isGuest ? "بازیکن" : "دوست");

  const level = profile?.level ?? 1;
  const coins = profile ? Math.max(100, profile.totalScore * 3) : 100;

  return (
    <HomeDashboard
      greetName={greetName}
      level={level}
      coins={coins}
      rooms={previewRooms}
      isRegistered={Boolean(profile)}
    />
  );
}
