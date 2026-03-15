import { useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import { getDayNumber, getPolishDayName, isWeekend } from "../utils/helpers";
import ActivityCard from "./ActivityCard";
import ActivityDetailSheet from "./ActivityDetailSheet";
import AddActivitySheet from "./AddActivitySheet";

interface DayRowProps {
  dateKey: string;
  index: number;
  activities: Activity[];
  currentUser: UserSession | null;
  actor: backendInterface | null;
  onRefresh: () => Promise<void>;
  onLoginRequired: () => void;
}

export default function DayRow({
  dateKey,
  index,
  activities,
  currentUser,
  actor,
  onRefresh,
  onLoginRequired,
}: DayRowProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  const dayName = getPolishDayName(dateKey);
  const dayNum = getDayNumber(dateKey);
  const weekend = isWeekend(dateKey);

  const matchKeys: Record<string, number> = {};
  for (const a of activities) {
    const k = `${a.emoji}|${a.startTime}`;
    matchKeys[k] = (matchKeys[k] ?? 0) + 1;
  }
  const isMatching = (a: Activity) =>
    (matchKeys[`${a.emoji}|${a.startTime}`] ?? 0) > 1;

  const handleAddClick = () => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    const userCount = activities.filter(
      (a) => a.username === currentUser.username,
    ).length;
    if (userCount >= 3) {
      toast.error("Osiągnąłeś limit 3 aktywności na ten dzień");
      return;
    }
    setAddOpen(true);
  };

  const handleCardClick = (activity: Activity) => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    setSelectedActivity(activity);
  };

  return (
    <div
      className="rounded-lg border border-border overflow-hidden bg-card"
      data-ocid={`calendar.day.item.${index}`}
    >
      <div className="flex items-stretch min-h-[64px]">
        {/* Day label - LEFT side, fully clickable, weekend highlighted only here */}
        <button
          type="button"
          onClick={handleAddClick}
          className={`flex flex-col items-center justify-center w-12 shrink-0 border-r border-border py-1 px-1 hover:bg-muted active:bg-muted/80 transition-colors ${
            weekend ? "day-weekend-label" : "bg-muted/60"
          }`}
          aria-label="Dodaj aktywność"
          data-ocid={`calendar.day.label.${index}`}
        >
          <span
            className={`text-[10px] font-bold leading-tight uppercase tracking-wide ${
              weekend ? "text-sky-400" : "text-foreground"
            }`}
          >
            {dayName}
          </span>
          <span
            className={`text-base font-extrabold leading-tight ${
              weekend ? "text-sky-400" : "text-foreground"
            }`}
          >
            {dayNum}
          </span>
        </button>

        {/* Activities area - always normal card bg */}
        <div className="flex-1 p-1.5 pl-1 bg-card">
          {activities.length === 0 ? (
            <button
              type="button"
              className="h-full min-h-[48px] w-full rounded-md hover:bg-muted/40 active:bg-muted/60 transition-colors"
              onClick={handleAddClick}
              data-ocid="calendar.day.empty_state"
            />
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {activities.map((a, ci) => (
                <ActivityCard
                  key={String(a.id)}
                  activity={a}
                  isMatching={isMatching(a)}
                  isOwn={currentUser?.username === a.username}
                  index={ci + 1}
                  onClick={() => handleCardClick(a)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {currentUser && addOpen && (
        <AddActivitySheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          dateKey={dateKey}
          actor={actor}
          currentUser={currentUser}
          dayActivities={activities}
          onSuccess={async () => {
            setAddOpen(false);
            await onRefresh();
          }}
        />
      )}

      {selectedActivity && currentUser && (
        <ActivityDetailSheet
          activity={selectedActivity}
          isOwn={currentUser.username === selectedActivity.username}
          currentUser={currentUser}
          allDayActivities={activities}
          actor={actor}
          onClose={() => setSelectedActivity(null)}
          onSuccess={async () => {
            setSelectedActivity(null);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}
