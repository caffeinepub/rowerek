import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
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
  const [emoji, setEmoji] = useState("🚴");
  // hours: 0 = none selected, 1-4 = selected hours
  const [hours, setHours] = useState(0);
  // halfHour: independent toggle for +30min
  const [halfHour, setHalfHour] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [quickEmojis, setQuickEmojis] = useState<string[]>(getQuickEmojis);
  const emojiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuickEmojis(getQuickEmojis());
    }
  }, [open]);

  const color = getUsernameColor(currentUser.username);

  const selectEmoji = (e: string) => {
    setEmoji(e);
    trackEmojiUsage(e);
    setQuickEmojis(getQuickEmojis());
  };

  const handleEmojiInputChange = (val: string) => {
    const chars = [...val];
    if (chars.length > 0) {
      const last = chars[chars.length - 1];
      selectEmoji(last);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
  };

  const handleSubmit = async () => {
    if (!actor) return;

    // Check for duplicate time
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
        note,
      );
      toast.success("Dodano aktywność!");
      const newActivity: Activity = {
        id: newId,
        dateKey,
        username: currentUser.username,
        startTime: time,
        emoji,
        durationHours: BigInt(durationHalfHours),
        note,
      };
      setTime("08:00");
      setEmoji("🚴");
      setHours(0);
      setHalfHour(false);
      setNote("");
      setSaving(false);
      onSuccess(newActivity);
    } catch {
      toast.error("Błąd dodawania aktywności");
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
        data-ocid="add_activity.sheet"
      >
        <SheetHeader className="mb-3">
          <div className="text-base font-semibold" style={{ color }}>
            {currentUser.username}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium text-foreground">
              Godzina rozpoczęcia
            </div>
            <Select value={time} onValueChange={handleTimeChange}>
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
          <div className="flex flex-col gap-1.5">
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
                ref={emojiInputRef}
                type="text"
                inputMode="text"
                value=""
                onChange={(e) => handleEmojiInputChange(e.target.value)}
                placeholder="📲 kliknij..."
                className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-xl text-center dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-2xl">{emoji}</span>
            </div>
          </div>

          {/* Duration: hour buttons + 1/2h toggle */}
          <div className="flex flex-col gap-1.5">
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
              {/* 1/2h toggle - independent */}
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

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <div className="text-sm font-medium text-foreground">
                Notatka (opcjonalnie)
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
              placeholder="Krótka wiadomość..."
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
