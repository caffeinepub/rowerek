import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, Message, backendInterface } from "../backend";
import { getUsernameColor } from "../utils/helpers";

interface ActivityDetailSheetProps {
  open: boolean;
  activity: Activity;
  currentUser: UserSession;
  allDayActivities: Activity[];
  actor: backendInterface | null;
  onClose: () => void;
  onSuccess: (updatedActivities: Activity[]) => void;
}

function formatDuration(halfHours: number): string {
  if (halfHours === 0) return "";
  const h = Math.floor(halfHours / 2);
  const half = halfHours % 2 === 1;
  if (h > 0 && half) return `${h}h 30min`;
  if (h > 0) return `${h}h`;
  return "30 min";
}

function relativeTime(ts: bigint): string {
  const date = new Date(Number(ts / 1_000_000n));
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} godz. temu`;
  if (diffH < 48) return "wczoraj";
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/** Other-user activity sheet: chat + join */
export default function ActivityDetailSheet({
  open,
  activity,
  currentUser,
  allDayActivities,
  actor,
  onClose,
  onSuccess,
}: ActivityDetailSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const color = getUsernameColor(activity.username);
  const durHalfHours = Number(activity.durationHours);
  const durLabel = formatDuration(durHalfHours);
  const threadId = `${activity.dateKey}|${activity.emoji}|${activity.startTime}`;

  useEffect(() => {
    if (!actor || !open) return;
    setLoadingMsgs(true);
    actor
      .getMessages(threadId)
      .then((msgs) => {
        setMessages(msgs);
        setLoadingMsgs(false);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      })
      .catch(() => setLoadingMsgs(false));
  }, [actor, threadId, open]);

  const handleSend = async () => {
    if (!actor || !msgText.trim()) return;
    setSending(true);
    try {
      await actor.addMessage(threadId, currentUser.username, msgText.trim());
      const updated = await actor.getMessages(threadId);
      setMessages(updated);
      setMsgText("");
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd wysyłania");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleJoin = async () => {
    if (!actor) return;
    const userCount = allDayActivities.filter(
      (a) => a.username === currentUser.username,
    ).length;
    if (userCount >= 3) {
      toast.error("Osiągnąłeś limit 3 aktywności na ten dzień");
      return;
    }
    const duplicate = allDayActivities.some(
      (a) =>
        a.username === currentUser.username &&
        a.startTime === activity.startTime,
    );
    if (duplicate) {
      toast.error(
        `Masz już aktywność o godzinie ${activity.startTime} w tym dniu`,
      );
      return;
    }
    setJoining(true);
    try {
      const newId = await actor.joinActivity(activity.id, currentUser.username);
      toast.success("Dołączyłeś do aktywności!");
      const newActivity: Activity = {
        id: newId,
        dateKey: activity.dateKey,
        username: currentUser.username,
        startTime: activity.startTime,
        emoji: activity.emoji,
        durationHours: activity.durationHours,
      };
      onSuccess([...allDayActivities, newActivity]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd dołączania");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-10 max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        data-ocid="activity.popover"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{activity.emoji}</span>
            <div>
              <span className="font-bold" style={{ color }}>
                {activity.username}
              </span>
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {activity.startTime}
                {durLabel ? ` · ${durLabel}` : ""}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* Chat */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Wątek rozmowy
            </div>
            <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
              <ScrollArea className="max-h-[200px]">
                <div className="flex flex-col gap-1 p-2 min-h-[60px]">
                  {loadingMsgs ? (
                    <p className="text-xs text-muted-foreground italic text-center py-3">
                      Ładowanie...
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-3">
                      Brak wiadomości
                    </p>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={msg.id.toString()}
                        className="flex flex-col gap-0.5 px-1 py-1 rounded-lg hover:bg-muted/50"
                        data-ocid={`activity.item.${i + 1}`}
                      >
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: getUsernameColor(msg.author) }}
                          >
                            {msg.author}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {relativeTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-snug break-words">
                          {msg.text}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
            </div>
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value.slice(0, 160))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Napisz wiadomość..."
                className="flex-1 h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={sending}
                maxLength={160}
                data-ocid="activity.input"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !msgText.trim()}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 shrink-0"
                data-ocid="activity.submit_button"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={joining}
            data-ocid="activity.join_button"
          >
            {joining ? "Dołączam..." : "🤝 Dołącz"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
