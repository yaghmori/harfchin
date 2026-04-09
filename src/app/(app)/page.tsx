import { HomeDashboard } from "@/components/home/HomeDashboard";
import { getUserShopBalance } from "@/server/services/coin-shop.service";
import * as roomService from "@/server/services/room.service";
import { getProfileForUser } from "@/server/services/profile.service";
import { getSessionUser } from "@/server/session";

export default async function HomePage() {
  const user = await getSessionUser();
  const profile =
    user && !user.isGuest && user.passwordHash
      ? await getProfileForUser(user.id)
      : null;

  const rooms = await roomService.listRoomsForDirectory();
  const previewRooms = rooms.slice(0, 3);

  const greetName =
    profile?.user.name?.trim().split(/\s+/)[0] ??
    user?.name?.trim().split(/\s+/)[0] ??
    (!user ? "مهمان" : user.isGuest ? "بازیکن" : "کاربر");

  const level = profile?.level ?? 1;
  const coins =
    profile && user
      ? await getUserShopBalance(user.id, profile.totalScore)
      : 100;

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
