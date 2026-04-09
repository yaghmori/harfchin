import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MessageCircle, RefreshCw, Send, Smile } from "lucide-react";
import { useEffect, useRef } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { ChatMessage } from "./types";

/** Physical L/R layout via `dir="ltr"` on rows; Persian text uses `dir="rtl"` / `auto` on content. */
const CHAT_QUICK_EMOJIS = [
  "😊",
  "😂",
  "❤️",
  "👍",
  "🎉",
  "😮",
  "🙏",
  "🔥",
] as const;

function ChatMessageRow({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  return (
    <div
      className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}
      dir="ltr"
    >
      <div
        className={cn(
          "flex max-w-[85%] items-end gap-3",
          isMine && "flex-row-reverse",
        )}
      >
        {!isMine ? <PlayerAvatar name={message.displayName} size="sm" /> : null}
        <div
          className={cn(
            "flex min-w-0 flex-col space-y-1",
            isMine ? "items-end" : "items-start",
          )}
        >
          <span
            dir="rtl"
            className={cn(
              "block w-full text-[10px] font-bold",
              isMine
                ? "text-start text-primary/60"
                : "text-end text-muted-foreground",
            )}
          >
            {isMine ? "شما" : message.displayName}
          </span>
          <div
            dir="auto"
            className={cn(
              "max-w-full rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm",
              isMine
                ? "rounded-bl-2xl rounded-br-md bg-primary text-white shadow-md shadow-primary/25"
                : "rounded-br-2xl rounded-bl-md bg-secondary text-foreground",
            )}
          >
            {message.body}
          </div>
        </div>
      </div>
    </div>
  );
}

type LobbyChatProps = {
  messages: ChatMessage[];
  meUserId: string;
  chatDraft: string;
  onChatDraftChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  chatBusy: boolean;
  chatDisabled: boolean;
  onRefreshMessages: () => void;
  chatRefreshing: boolean;
};

export function LobbyChat({
  messages,
  meUserId,
  chatDraft,
  onChatDraftChange,
  onSubmit,
  chatBusy,
  chatDisabled,
  onRefreshMessages,
  chatRefreshing,
}: LobbyChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="mb-4">
      <Card className="flex max-h-[min(700px,75vh)] flex-col overflow-hidden rounded-[2rem] border-border/60 shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-card/70  backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-end gap-1">
              <MessageCircle
                className="size-6 text-primary fill-primary/10"
                aria-hidden
              />
              گپ و گفت اتاق
            </CardTitle>
            <p className="text-[9px] font-bold text-primary/60">
              پیام‌ها برای اعضای اتاق ذخیره می‌شوند
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="به‌روزرسانی پیام‌ها"
            onClick={() => onRefreshMessages()}
          >
            <RefreshCw
              className={cn("size-4", chatRefreshing && "animate-spin")}
            />
          </Button>
        </CardHeader>
        <CardContent
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto scroll-smooth bg-[radial-gradient(#e8e8e8_1px,transparent_1px)] bg-size-[20px_20px] py-4 dark:bg-[radial-gradient(rgb(39_39_42/0.5)_1px,transparent_1px)]"
        >
          <div className="space-y-5 px-2">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                هنوز پیامی نیست — اولین نفری باشید که سلام می‌کند.
              </p>
            ) : null}
            {messages.map((m) => (
              <ChatMessageRow
                key={m.id}
                message={m}
                isMine={m.userId === meUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="border-t border-border/50 bg-card" dir="rtl">
          <form className="flex w-full items-center gap-2" onSubmit={onSubmit}>
            <Button
              type="submit"
              variant="default"
              size="icon-lg"
              className="shrink-0 rounded-2xl shadow-lg shadow-primary/20"
              disabled={chatBusy || !chatDraft.trim() || chatDisabled}
              aria-label="ارسال"
            >
              <Send className="size-5" />
            </Button>
            <Input
              value={chatDraft}
              onChange={(e) => onChatDraftChange(e.target.value)}
              placeholder="پیامی بنویسید…"
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              disabled={chatBusy || chatDisabled}
              className="h-12 flex-1 rounded-2xl border-0 text-start text-sm"
              dir="rtl"
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="shrink-0 text-muted-foreground hover:text-primary"
                    aria-label="ایموجی"
                    disabled={chatBusy || chatDisabled}
                  />
                }
              >
                <Smile className="size-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] p-2">
                <div className="grid grid-cols-4 gap-1">
                  {CHAT_QUICK_EMOJIS.map((emoji) => (
                    <DropdownMenuItem
                      key={emoji}
                      className="flex cursor-pointer justify-center p-2 text-lg"
                      onClick={() => onChatDraftChange(chatDraft + emoji)}
                    >
                      {emoji}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </form>
        </CardFooter>
      </Card>
    </section>
  );
}
