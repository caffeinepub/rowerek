import { Skeleton } from "@/components/ui/skeleton";
import type { UserSession } from "../App";
import type { Activity, backendInterface } from "../backend";
import DayRow from "./DayRow";

interface CalendarViewProps {
  dateKeys: string[];
  activities: Record<string, Activity[]>;
  loading: boolean;
  currentUser: UserSession | null;
  actor: backendInterface | null;
  userColors: Record<string, string>;
  onDayRefresh: (dateKey: string) => Promise<void>;
  onSetDayActivities: (dateKey: string, activities: Activity[]) => void;
  onLoginRequired: () => void;
}

const SKELETON_IDS = ["s1", "s2", "s3", "s4", "s5", "s6"];

export default function CalendarView({
  dateKeys,
  activities,
  loading,
  currentUser,
  actor,
  userColors,
  onDayRefresh,
  onSetDayActivities,
  onLoginRequired,
}: CalendarViewProps) {
  if (loading) {
    return (
      <div
        className="flex flex-col gap-3 mt-3"
        data-ocid="calendar.loading_state"
      >
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="h-14 w-full rounded-lg bg-muted/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-3">
      {dateKeys.map((dk, index) => (
        <DayRow
          key={dk}
          dateKey={dk}
          index={index + 1}
          activities={activities[dk] ?? []}
          currentUser={currentUser}
          actor={actor}
          userColors={userColors}
          onRefresh={() => onDayRefresh(dk)}
          onSetDayActivities={onSetDayActivities}
          onLoginRequired={onLoginRequired}
        />
      ))}
    </div>
  );
}
