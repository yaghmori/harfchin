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

export default function CreateRoomPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [rounds, setRounds] = useState(5);
  const [seconds, setSeconds] = useState(120);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ roomCode: string }>("/api/room/create", {
        displayName,
        draftTotalRounds: rounds,
        draftRoundTimeSec: seconds,
        maxPlayers,
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
      <h1 className="mb-6 text-2xl font-bold">ساخت اتاق</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">جزئیات اتاق</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="r">تعداد دور</Label>
                <Input
                  id="r"
                  type="number"
                  min={1}
                  max={20}
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t">زمان دور (ثانیه)</Label>
                <Input
                  id="t"
                  type="number"
                  min={30}
                  max={600}
                  value={seconds}
                  onChange={(e) => setSeconds(Number(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m">حداکثر بازیکن</Label>
              <Input
                id="m"
                type="number"
                min={2}
                max={16}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="h-10"
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
              {loading ? "در حال ساخت…" : "ساخت اتاق"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </SiteShell>
  );
}
