"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { apiPost } from "@/features/api/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinRoomPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ roomCode: string }>("/api/room/join", {
        roomCode: roomCode.trim(),
        displayName,
      });
      router.push(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <h1 className="mb-6 text-2xl font-bold">ورود به اتاق</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">ورود</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">کد اتاق</Label>
              <Input
                id="code"
                name="roomCode"
                required
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="h-10 font-mono tracking-widest"
                dir="ltr"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dn">نام نمایشی</Label>
              <Input
                id="dn"
                name="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10"
                autoComplete="nickname"
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              {loading ? "در حال ورود…" : "ورود"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
