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
import { useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import { TIME_OPTIONS, getUsernameColor } from "../utils/helpers";

interface ActivityDetailSheetProps {
  activity: Activity;
  isOwn: boolean;
  currentUser: UserSession;
  allDayActivities: Activity[];
  actor: backendInterface | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

function formatDuration(halfHours: number): string {
  if (halfHours === 0) return "";
  const h = Math.floor(halfHours / 2);
  const half = halfHours % 2 === 1;
  if (h > 0 && half) return `${h}h 30min`;
  if (h > 0) return `${h}h`;
  return "30 min";
}

export default function ActivityDetailSheet({
  activity,
  isOwn,
  currentUser,
  allDayActivities,
  actor,
  onClose,
  onSuccess,
}: ActivityDetailSheetProps) {
  const [newTime, setNewTime] = useState(activity.startTime);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [joining, setJoining] = useState(false);

  const color = getUsernameColor(activity.username);
  const durHalfHours = Number(activity.durationHours);
  const durLabel = formatDuration(durHalfHours);

  const handleSave = async () => {
    if (!actor) return;

    // Check for duplicate time (exclude current activity)
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
      await onSuccess();
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor) return;
    setDeleting(true);
    try {
      await actor.deleteActivity(activity.id);
      toast.success("Usunięto aktywność");
      await onSuccess();
    } catch {
      toast.error("Błąd usuwania");
    } finally {
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
    // Check for duplicate time
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
      await actor.joinActivity(activity.id, currentUser.username);
      toast.success("Dołączyłeś do aktywności!");
      await onSuccess();
    } catch {
      toast.error("Błąd dołączania");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-10"
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

        {isOwn ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="text-sm font-medium text-foreground">
                Zmień godzinę
              </div>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="w-full">
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
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving || newTime === activity.startTime}
                data-ocid="activity.save_button"
              >
                {saving ? "Zapisuję..." : "Zapisz"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
                data-ocid="activity.delete_button"
              >
                {deleting ? "Usuwam..." : "Usuń"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activity.note ? (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-foreground">{activity.note}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Brak notatki
              </p>
            )}
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
