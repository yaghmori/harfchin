import { Suspense } from "react";

import { JoinRoomForm } from "./JoinRoomForm";

function JoinFallback() {
  return (
    <div className="min-h-dvh bg-background" aria-busy aria-label="بارگذاری" />
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinRoomForm />
    </Suspense>
  );
}
