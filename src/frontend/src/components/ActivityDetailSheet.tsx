import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TIME_OPTIONS, getUsernameColor } from "../utils/helpers";

interface ActivityDetailSheetProps {
  open: boolean;
  activity: Activity;
  isOwn: boolean;
  currentUser: UserSession;
  allDayActivities: Activity[];
  actor: backendInterface | null;
  userColors: Record<string, string>;
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

function ChatSection({
  threadId,
  actor,
  currentUser,
  userColors,
}: {
  threadId: string;
  actor: backendInterface | null;
  currentUser: UserSession | null;
  userColors: Record<string, string>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!actor) return;
    setLoadingMsgs(true);
    actor
      .getMessages(threadId)
      .then((msgs) => {
        setMessages(msgs);
        setLoadingMsgs(false);
        scrollToBottom();
      })
      .catch(() => {
        setLoadingMsgs(false);
      });
  }, [actor, threadId]);

  const scrollToBottom = () => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const handleSend = async () => {
    if (!actor || !currentUser || !msgText.trim()) return;
    setSending(true);
    try {
      await actor.addMessage(threadId, currentUser.username, msgText.trim());
      const updated = await actor.getMessages(threadId);
      setMessages(updated);
      scrollToBottom();
      setMsgText("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Błąd wysyłania wiadomości";
      toast.error(msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-1.5" data-ocid="activity.panel">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
        Wątek rozmowy
      </div>

      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <ScrollArea className="max-h-[220px]">
          <div className="flex flex-col gap-0.5 p-2 min-h-[60px]">
            {loadingMsgs ? (
              <p
                className="text-xs text-muted-foreground italic text-center py-3"
                data-ocid="activity.loading_state"
              >
                Ładowanie...
              </p>
            ) : messages.length === 0 ? (
              <p
                className="text-xs text-muted-foreground italic text-center py-3"
                data-ocid="activity.empty_state"
              >
                Brak wiadomości
              </p>
            ) : (
              messages.map((msg, i) => {
                const authorColor = getUsernameColor(msg.author, userColors);
                return (
                  <div
                    key={msg.id.toString()}
                    className="flex flex-col gap-0.5 px-1 py-0.5 rounded-lg hover:bg-muted/50 transition-colors"
                    data-ocid={`activity.item.${i + 1}`}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-xs font-semibold leading-none"
                        style={{ color: authorColor }}
                      >
                        {msg.author}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-none">
                        {relativeTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug break-words">
                      {msg.text}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {currentUser ? (
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value.slice(0, 160))}
            onKeyDown={handleKeyDown}
            placeholder="Napisz wiadomość..."
            className="flex-1 h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:text-foreground"
            disabled={sending}
            maxLength={160}
            data-ocid="activity.input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !msgText.trim()}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity shrink-0"
            data-ocid="activity.submit_button"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic text-center">
          Zaloguj się, aby pisać
        </p>
      )}
    </div>
  );
}

export default function ActivityDetailSheet({
  open,
  activity,
  isOwn,
  currentUser,
  allDayActivities,
  actor,
  userColors,
  onClose,
  onSuccess,
}: ActivityDetailSheetProps) {
  const [newTime, setNewTime] = useState(activity.startTime);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [joining, setJoining] = useState(false);

  const color = getUsernameColor(activity.username, userColors);
  const durHalfHours = Number(activity.durationHours);
  const durLabel = formatDuration(durHalfHours);

  const threadId = `${activity.dateKey}|${activity.emoji}|${activity.startTime}`;

  const handleSave = async () => {
    if (!actor) return;
    const duplicate = allDayActivities.some(
      (a) =>
        a.id !== activity.id &&
        a.username === activity.username &&
        a.startTime === newTime,
    );
    if (duplicate) {
      toast.error(`Masz już aktywność o godzinie ${newTime} w tym dniu`);
      return;
    }
    setSaving(true);
    try {
      await actor.updateActivityTime(activity.id, newTime);
      toast.success("Zmieniono godzinę");
      const updated = allDayActivities.map((a) =>
        a.id === activity.id ? { ...a, startTime: newTime } : a,
      );
      setSaving(false);
      onSuccess(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd zapisu";
      toast.error(msg);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor) return;
    setDeleting(true);
    try {
      await actor.deleteActivity(activity.id);
      toast.success("Usunięto aktywność");
      const updated = allDayActivities.filter((a) => a.id !== activity.id);
      setDeleting(false);
      onSuccess(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd usuwania";
      toast.error(msg);
      setDeleting(false);
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
      const updated = [...allDayActivities, newActivity];
      setJoining(false);
      onSuccess(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd dołączania";
      toast.error(msg);
      setJoining(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-8 max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        data-ocid="activity.popover"
      >
        <SheetHeader className="mb-3">
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

        {isOwn ? (
          <div className="flex flex-col gap-3">
            {/* Chat section */}
            <ChatSection
              threadId={threadId}
              actor={actor}
              currentUser={currentUser}
              userColors={userColors}
            />

            <div className="h-px bg-border" />

            {/* Time change */}
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-foreground shrink-0">
                Godzina:
              </div>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger
                  className="flex-1 h-9"
                  data-ocid="activity.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_OPTIONS.map((t) => {
                    const hasDuplicate =
                      t !== activity.startTime &&
                      allDayActivities.some(
                        (a) =>
                          a.id !== activity.id &&
                          a.username === activity.username &&
                          a.startTime === t,
                      );
                    return (
                      <SelectItem
                        key={t}
                        value={t}
                        className={`${hasDuplicate ? "opacity-40" : ""}`}
                      >
                        {t}
                        {hasDuplicate ? " ✗" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="shrink-0"
                onClick={handleSave}
                disabled={saving || newTime === activity.startTime}
                data-ocid="activity.save_button"
              >
                {saving ? "..." : "Zmień"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                onClick={handleDelete}
                disabled={deleting}
                data-ocid="activity.delete_button"
              >
                {deleting ? "..." : "Usuń"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ChatSection
              threadId={threadId}
              actor={actor}
              currentUser={currentUser}
              userColors={userColors}
            />

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
        )}
      </SheetContent>
    </Sheet>
  );
}
