import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, Message, backendInterface } from "../backend";
import {
  TIME_OPTIONS,
  getQuickEmojis,
  getUsernameColor,
  trackEmojiUsage,
} from "../utils/helpers";

interface ActivitySheetProps {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  /** null = new activity mode; Activity = edit own activity mode */
  activity: Activity | null;
  currentUser: UserSession;
  dayActivities: Activity[];
  actor: backendInterface | null;
  onSuccess: (activities: Activity[]) => void;
}

const HOUR_OPTIONS = [
  { value: 1, label: "1h" },
  { value: 2, label: "2h" },
  { value: 3, label: "3h" },
  { value: 4, label: "4h" },
];

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
}: {
  threadId: string;
  actor: backendInterface | null;
  currentUser: UserSession;
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
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      })
      .catch(() => setLoadingMsgs(false));
  }, [actor, threadId]);

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

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Wątek rozmowy
      </div>
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <ScrollArea className="max-h-[180px]">
          <div className="flex flex-col gap-1 p-2 min-h-[48px]">
            {loadingMsgs ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                Ładowanie...
              </p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">
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
  );
}

export default function ActivitySheet({
  open,
  onClose,
  dateKey,
  activity,
  currentUser,
  dayActivities,
  actor,
  onSuccess,
}: ActivitySheetProps) {
  const isEditMode = activity !== null;

  const [time, setTime] = useState(activity?.startTime ?? "08:00");
  const [emoji, setEmoji] = useState("🚴");
  const [hours, setHours] = useState(0);
  const [halfHour, setHalfHour] = useState(false);
  const [note, setNote] = useState("");
  const [quickEmojis, setQuickEmojis] = useState<string[]>(getQuickEmojis);
  const emojiInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const color = getUsernameColor(currentUser.username);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setQuickEmojis(getQuickEmojis());
      if (activity) {
        setTime(activity.startTime);
      } else {
        setTime("08:00");
        setEmoji("🚴");
        setHours(0);
        setHalfHour(false);
        setNote("");
      }
    }
  }, [open, activity]);

  const selectEmoji = (e: string) => {
    setEmoji(e);
    trackEmojiUsage(e);
    setQuickEmojis(getQuickEmojis());
  };

  // Create new activity
  const handleCreate = async () => {
    if (!actor || isEditMode) return;
    const duplicate = dayActivities.some(
      (a) => a.username === currentUser.username && a.startTime === time,
    );
    if (duplicate) {
      toast.error(`Masz już aktywność o godzinie ${time} w tym dniu`);
      return;
    }
    const durationHalfHours = hours * 2 + (halfHour ? 1 : 0);
    setSaving(true);
    try {
      const newId = await actor.addActivity(
        dateKey,
        currentUser.username,
        time,
        emoji,
        BigInt(durationHalfHours),
      );
      if (note.trim()) {
        const threadId = `${dateKey}|${emoji}|${time}`;
        try {
          await actor.addMessage(threadId, currentUser.username, note.trim());
        } catch {
          // non-fatal
        }
      }
      toast.success("Dodano aktywność!");
      const newActivity: Activity = {
        id: newId,
        dateKey,
        username: currentUser.username,
        startTime: time,
        emoji,
        durationHours: BigInt(durationHalfHours),
      };
      onSuccess([...dayActivities, newActivity]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd dodawania");
    } finally {
      setSaving(false);
    }
  };

  // Change time of existing activity
  const handleChange = async () => {
    if (!actor || !activity || time === activity.startTime) return;
    const duplicate = dayActivities.some(
      (a) =>
        a.id !== activity.id &&
        a.username === activity.username &&
        a.startTime === time,
    );
    if (duplicate) {
      toast.error(`Masz już aktywność o godzinie ${time} w tym dniu`);
      return;
    }
    setSaving(true);
    try {
      await actor.updateActivityTime(activity.id, time);
      toast.success("Zmieniono godzinę");
      const updated = dayActivities.map((a) =>
        a.id === activity.id ? { ...a, startTime: time } : a,
      );
      onSuccess(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  // Delete existing activity
  const handleDelete = async () => {
    if (!actor || !activity) return;
    setDeleting(true);
    try {
      await actor.deleteActivity(activity.id);
      toast.success("Usunięto aktywność");
      const updated = dayActivities.filter((a) => a.id !== activity.id);
      onSuccess(updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd usuwania");
    } finally {
      setDeleting(false);
    }
  };

  const threadId = activity
    ? `${activity.dateKey}|${activity.emoji}|${activity.startTime}`
    : "";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-10 max-h-[92vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        data-ocid="add_activity.sheet"
      >
        <SheetHeader className="mb-3">
          <div className="flex items-center gap-2">
            {isEditMode && <span className="text-2xl">{activity.emoji}</span>}
            <span className="text-base font-semibold" style={{ color }}>
              {currentUser.username}
            </span>
            {isEditMode && (
              <span className="text-sm text-muted-foreground ml-1">
                {activity.startTime}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* Large time picker grid */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium text-foreground">
              Godzina{isEditMode ? " (zmiana)" : " rozpoczęcia"}
            </div>
            <div
              className="grid gap-1 overflow-y-auto"
              style={{
                gridTemplateColumns: "repeat(4, 1fr)",
                maxHeight: "200px",
              }}
            >
              {TIME_OPTIONS.map((t) => {
                const isSelected = time === t;
                const isOriginal = isEditMode && activity.startTime === t;
                const hasDuplicate = isEditMode
                  ? t !== activity.startTime &&
                    dayActivities.some(
                      (a) =>
                        a.id !== activity.id &&
                        a.username === activity.username &&
                        a.startTime === t,
                    )
                  : dayActivities.some(
                      (a) =>
                        a.username === currentUser.username &&
                        a.startTime === t,
                    );
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => !hasDuplicate && setTime(t)}
                    className={`h-11 text-sm font-mono font-bold rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isOriginal
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : hasDuplicate
                            ? "opacity-30 border-border cursor-not-allowed"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                    data-ocid="add_activity.time_select"
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* New activity: emoji + duration + note */}
          {!isEditMode && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="text-sm font-medium text-foreground">
                  Emotka
                </div>
                <div className="flex gap-2 items-center">
                  {quickEmojis.map((e) => (
                    <button
                      type="button"
                      key={e}
                      onClick={() => selectEmoji(e)}
                      className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                        emoji === e
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    Wpisz lub wybierz:
                  </span>
                  <input
                    ref={emojiInputRef}
                    type="text"
                    inputMode="text"
                    value=""
                    onChange={(e) => {
                      const chars = [...e.target.value];
                      if (chars.length > 0)
                        selectEmoji(chars[chars.length - 1]);
                    }}
                    placeholder="📲 kliknij..."
                    className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-xl text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-2xl">{emoji}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="text-sm font-medium text-foreground">
                  Czas trwania
                </div>
                <div className="flex gap-1.5">
                  {HOUR_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() =>
                        setHours(hours === opt.value ? 0 : opt.value)
                      }
                      className={`flex-1 h-10 text-sm font-medium rounded-lg border-2 transition-all ${
                        hours === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHalfHour(!halfHour)}
                    className={`flex-1 h-10 text-sm font-medium rounded-lg border-2 transition-all ${
                      halfHour
                        ? "border-sky-400 bg-sky-400/20 text-sky-400"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    ½h
                  </button>
                </div>
                {(hours > 0 || halfHour) && (
                  <div className="text-xs text-muted-foreground">
                    Łącznie:{" "}
                    {hours > 0 && halfHour
                      ? `${hours}h 30min`
                      : hours > 0
                        ? `${hours}h`
                        : "30 min"}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-foreground">
                    Wiadomość (opcjonalnie)
                  </div>
                  <span
                    className={`text-xs ${
                      note.length > 145
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {note.length}/160
                  </span>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 160))}
                  placeholder="Napisz wiadomość do wątku..."
                  className="resize-none h-16 text-sm text-foreground placeholder:text-muted-foreground"
                  maxLength={160}
                />
              </div>
            </>
          )}

          {/* Edit mode: chat section */}
          {isEditMode && (
            <ChatSection
              threadId={threadId}
              actor={actor}
              currentUser={currentUser}
            />
          )}

          {/* Three action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleCreate}
              disabled={isEditMode || saving}
              className="h-12 text-sm font-semibold"
              data-ocid="add_activity.submit_button"
            >
              {saving && !isEditMode ? "..." : "Utwórz"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleChange}
              disabled={!isEditMode || time === activity?.startTime || saving}
              className="h-12 text-sm font-semibold"
              data-ocid="activity.save_button"
            >
              {saving && isEditMode ? "..." : "Zmień"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isEditMode || deleting}
              className="h-12 text-sm font-semibold"
              data-ocid="activity.delete_button"
            >
              {deleting ? "..." : "Usuń"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
