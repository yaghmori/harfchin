import type { Metadata } from "next";

import { CreateRoomClient } from "@/components/create/CreateRoomClient";

export const metadata: Metadata = {
  title: "ایجاد اتاق بازی",
};

export default function CreateRoomPage() {
  return <CreateRoomClient />;
}
