import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MessageCircle, MoreVertical, Send, Smile } from "lucide-react";
import { useEffect, useRef } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { ChatMessage } from "./types";

function ChatMessageRow({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full",
        /* RTL: inline-start = physical right (mine), inline-end = physical left (others) */
        isMine ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] items-end gap-3",
          isMine && "flex-row-reverse",
        )}
      >
        {!isMine ? (
          <PlayerAvatar name={message.displayName} size="sm" />
        ) : null}
        <div
          className={cn(
            "min-w-0 space-y-1",
            isMine && "flex flex-col items-end",
          )}
        >
          <span
            className={cn(
              "block text-[10px] font-bold",
              isMine ? "text-ka-primary/60" : "text-muted-foreground",
            )}
          >
            {isMine ? "شما" : message.displayName}
          </span>
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm",
              isMine
                ? "rounded-bl-md bg-ka-primary text-white shadow-md shadow-ka-primary/25"
                : "rounded-br-md bg-ka-surface-container-low text-ka-on-background",
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
};

export function LobbyChat({
  messages,
  meUserId,
  chatDraft,
  onChatDraftChange,
  onSubmit,
  chatBusy,
  chatDisabled,
}: LobbyChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="mb-4">
      <Card className="flex max-h-[min(500px,55vh)] flex-col overflow-hidden rounded-[2rem] border-ka-surface-container-high shadow-[0_12px_32px_rgba(25,28,29,0.06)]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-ka-surface-container bg-ka-surface-container-lowest/50 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-ka-primary/10">
              <MessageCircle className="size-5 text-ka-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-sm font-black">گپ و گفت اتاق</CardTitle>
              <p className="text-[9px] font-bold text-ka-primary/60">
                پیام‌ها برای اعضای اتاق ذخیره می‌شوند
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-ka-on-surface-variant"
            aria-label="بیشتر"
          >
            <MoreVertical className="size-4" />
          </Button>
        </CardHeader>
        <CardContent
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto scroll-smooth bg-[radial-gradient(#e8e8e8_1px,transparent_1px)] [background-size:20px_20px] py-4 dark:bg-[radial-gradient(rgb(39_39_42/0.5)_1px,transparent_1px)]"
        >
          <div className="space-y-5 px-2">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-ka-on-surface-variant">
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
        <CardFooter className="border-t border-ka-surface-container bg-ka-surface-container-lowest">
          <form
            className="flex w-full items-center gap-2"
            onSubmit={onSubmit}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="shrink-0 text-ka-on-surface-variant hover:text-ka-primary"
              aria-label="ایموجی"
              onClick={() => {
                onChatDraftChange(chatDraft + "😊");
              }}
            >
              <Smile className="size-6" />
            </Button>
            <Input
              value={chatDraft}
              onChange={(e) => onChatDraftChange(e.target.value)}
              placeholder="پیامی بنویسید…"
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              disabled={chatBusy || chatDisabled}
              className="h-12 flex-1 rounded-2xl border-0 text-sm"
              dir="auto"
            />
            <Button
              type="submit"
              variant="default"
              size="icon-lg"
              className="shrink-0 rounded-2xl shadow-lg shadow-ka-primary/20"
              disabled={chatBusy || !chatDraft.trim() || chatDisabled}
              aria-label="ارسال"
            >
              <Send className="size-5 rtl:rotate-180" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </section>
  );
}
