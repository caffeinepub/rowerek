import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import {
  TIME_OPTIONS,
  getQuickEmojis,
  getUsernameColor,
  trackEmojiUsage,
} from "../utils/helpers";

interface AddActivitySheetProps {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  actor: backendInterface | null;
  currentUser: UserSession;
  dayActivities: Activity[];
  onSuccess: (newActivity: Activity) => void;
}

const HOUR_OPTIONS = [
  { value: 1, label: "1h" },
  { value: 2, label: "2h" },
  { value: 3, label: "3h" },
  { value: 4, label: "4h" },
];

/** Extract the last grapheme cluster from a string using Intl.Segmenter */
function getLastGrapheme(str: string): string {
  if (!str) return "";
  try {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    const segments = [...segmenter.segment(str)];
    if (segments.length === 0) return "";
    return segments[segments.length - 1].segment;
  } catch {
    // Fallback for environments without Intl.Segmenter
    const chars = [...str];
    return chars[chars.length - 1] ?? "";
  }
}

export default function AddActivitySheet({
  open,
  onClose,
  dateKey,
  actor,
  currentUser,
  dayActivities,
  onSuccess,
}: AddActivitySheetProps) {
  const [time, setTime] = useState("08:00");
  const [emoji, setEmoji] = useState("\uD83D\uDEB4");
  const [hours, setHours] = useState(0);
  const [halfHour, setHalfHour] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [quickEmojis, setQuickEmojis] = useState<string[]>(getQuickEmojis);
  const [emojiKey, setEmojiKey] = useState(0);

  // Visibility
  const [visMode, setVisMode] = useState<"wszyscy" | "wybrane">("wszyscy");
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuickEmojis(getQuickEmojis());
      // Fetch users for visibility picker
      if (actor) {
        actor
          .getUsers()
          .then((users) => {
            const names = users
              .map(([name]) => name)
              .filter((n) => n !== currentUser.username && n !== "admin");
            setAllUsers(names);
          })
          .catch(() => {});
      }
    } else {
      // Reset on close
      setVisMode("wszyscy");
      setSelectedUsers([]);
    }
  }, [open, actor, currentUser.username]);

  const color = getUsernameColor(currentUser.username);

  const selectEmoji = (e: string) => {
    setEmoji(e);
    trackEmojiUsage(e);
    setQuickEmojis(getQuickEmojis());
    setEmojiKey((k) => k + 1);
  };

  const handleEmojiInputChange = (val: string) => {
    const lastGrapheme = getLastGrapheme(val);
    if (lastGrapheme?.trim()) {
      selectEmoji(lastGrapheme);
    }
  };

  const toggleUser = (username: string) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username],
    );
  };

  const handleSubmit = async () => {
    if (!actor) return;

    const duplicate = dayActivities.some(
      (a) => a.username === currentUser.username && a.startTime === time,
    );
    if (duplicate) {
      toast.error(`Masz już aktywność o godzinie ${time} w tym dniu`);
      return;
    }

    if (visMode === "wybrane" && selectedUsers.length === 0) {
      toast.error(
        "Wybierz przynajmniej jedną osobę lub zmień widoczność na wszyscy",
      );
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

      // Set visibility if not public
      if (visMode === "wybrane" && selectedUsers.length > 0) {
        try {
          await actor.setVisibility(newId, selectedUsers.join(","));
        } catch {
          // non-fatal
        }
      }

      // Post initial note as message
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
      setTime("08:00");
      setEmoji("\uD83D\uDEB4");
      setHours(0);
      setHalfHour(false);
      setNote("");
      setVisMode("wszyscy");
      setSelectedUsers([]);
      setSaving(false);
      onSuccess(newActivity);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Błąd dodawania aktywności";
      toast.error(msg);
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-10 max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        data-ocid="add_activity.sheet"
      >
        <div className="flex flex-col gap-3 px-4 pt-3">
          {/* Username */}
          <div className="text-base font-semibold" style={{ color }}>
            {currentUser.username}
          </div>

          {/* Time */}
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-foreground">
              Godzina rozpoczęcia
            </div>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger
                className="h-14 text-base font-semibold text-foreground dark:text-foreground"
                data-ocid="add_activity.time_select"
              >
                <SelectValue className="text-base" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {TIME_OPTIONS.map((t) => {
                  const hasDuplicate = dayActivities.some(
                    (a) =>
                      a.username === currentUser.username && a.startTime === t,
                  );
                  return (
                    <SelectItem
                      key={t}
                      value={t}
                      className={`text-base h-10 ${
                        hasDuplicate ? "opacity-40" : ""
                      }`}
                    >
                      {t}
                      {hasDuplicate ? " ✗" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Emoji */}
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-foreground">Emotka</div>
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
                  data-ocid="add_activity.emoji_input"
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
                key={emojiKey}
                type="text"
                inputMode="text"
                defaultValue=""
                onChange={(e) => handleEmojiInputChange(e.target.value)}
                placeholder="\uD83D\uDCF2 kliknij..."
                className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-xl text-center dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-xl border-2 border-primary/40 bg-primary/5"
                aria-label="Wybrana emotka"
              >
                {emoji}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-foreground">
              Czas trwania
            </div>
            <div className="flex gap-1.5">
              {HOUR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setHours(hours === opt.value ? 0 : opt.value)}
                  className={`flex-1 h-10 text-sm font-medium rounded-lg border-2 transition-all ${
                    hours === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                  data-ocid="add_activity.duration.toggle"
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
                data-ocid="add_activity.half_hour.toggle"
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

          {/* Visibility */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium text-foreground">
              Widoczność
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisMode("wszyscy")}
                className={`flex-1 h-10 text-sm font-medium rounded-lg border-2 transition-all ${
                  visMode === "wszyscy"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                Wszyscy
              </button>
              <button
                type="button"
                onClick={() => setVisMode("wybrane")}
                className={`flex-1 h-10 text-sm font-medium rounded-lg border-2 transition-all ${
                  visMode === "wybrane"
                    ? "border-sky-400 bg-sky-400/20 text-sky-400"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                Wybrane osoby
              </button>
            </div>

            {visMode === "wybrane" && (
              <div className="flex flex-col gap-1 pl-1">
                {allUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Brak innych użytkowników
                  </p>
                ) : (
                  allUsers.map((username) => (
                    <label
                      key={username}
                      className="flex items-center gap-2 cursor-pointer py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(username)}
                        onChange={() => toggleUser(username)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: getUsernameColor(username) }}
                      >
                        {username}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Initial message / note */}
          <div className="flex flex-col gap-1">
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
              className="resize-none h-16 text-sm dark:text-foreground dark:placeholder:text-muted-foreground"
              maxLength={160}
              data-ocid="add_activity.textarea"
            />
          </div>

          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleSubmit}
            disabled={saving}
            data-ocid="add_activity.submit_button"
          >
            {saving ? "Dodaję..." : "Dodaj aktywność"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
