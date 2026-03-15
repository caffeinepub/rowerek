import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import { QUICK_EMOJIS, TIME_OPTIONS, getUsernameColor } from "../utils/helpers";

interface AddActivitySheetProps {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  actor: backendInterface | null;
  currentUser: UserSession;
  dayActivities: Activity[];
  onSuccess: () => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: 0, label: "∞" },
  { value: 1, label: "1h" },
  { value: 2, label: "2h" },
  { value: 3, label: "3h" },
  { value: 4, label: "4h" },
];

function getPickerTheme(): Theme {
  return document.documentElement.classList.contains("dark")
    ? Theme.DARK
    : Theme.LIGHT;
}

export default function AddActivitySheet({
  open,
  onClose,
  dateKey,
  actor,
  currentUser,
  onSuccess,
}: AddActivitySheetProps) {
  const [time, setTime] = useState("08:00");
  const [emoji, setEmoji] = useState("🚴");
  const [duration, setDuration] = useState(0);
  const [note, setNote] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const color = getUsernameColor(currentUser.username);

  const handleSubmit = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.addActivity(
        dateKey,
        currentUser.username,
        time,
        emoji,
        BigInt(duration),
        note,
      );
      toast.success("Dodano aktywność!");
      setTime("08:00");
      setEmoji("🚴");
      setDuration(0);
      setNote("");
      setShowEmojiPicker(false);
      await onSuccess();
    } catch {
      toast.error("Błąd dodawania aktywności");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-10 max-h-[90vh] overflow-y-auto"
        data-ocid="add_activity.sheet"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg font-display">
            Dodaj aktywność
          </SheetTitle>
          <div className="text-sm font-semibold" style={{ color }}>
            {currentUser.username}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium">Godzina rozpoczęcia</div>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger data-ocid="add_activity.time_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emoji */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium">Emotka</div>
            <div className="flex gap-2 items-center">
              {QUICK_EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => {
                    setEmoji(e);
                    setShowEmojiPicker(false);
                  }}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                    emoji === e
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  data-ocid="add_activity.emoji_input"
                >
                  {e}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="flex-1 h-10 text-xs rounded-lg border border-border bg-card hover:bg-muted transition-colors px-2 text-muted-foreground"
              >
                {showEmojiPicker ? "Ukryj" : "Wszystkie emotki"}
              </button>
            </div>
            {showEmojiPicker && (
              <div className="animate-fade-in">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setEmoji(emojiData.emoji);
                    setShowEmojiPicker(false);
                  }}
                  theme={getPickerTheme()}
                  width="100%"
                  height={350}
                  searchPlaceholder="Szukaj emotki..."
                />
              </div>
            )}
            <div className="text-center text-2xl pt-1">Wybrana: {emoji}</div>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium">Czas trwania</div>
            <div className="flex gap-1.5">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`flex-1 h-10 text-sm font-medium rounded-lg border-2 transition-all ${
                    duration === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                  data-ocid="add_activity.duration.toggle"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <div className="text-sm font-medium">Notatka (opcjonalnie)</div>
              <span
                className={`text-xs ${
                  note.length > 75
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {note.length}/80
              </span>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 80))}
              placeholder="Krótka wiadomość..."
              className="resize-none h-16 text-sm"
              maxLength={80}
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
