import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Activity {
    id: bigint;
    startTime: string;
    dateKey: string;
    username: string;
    note: string;
    durationHours: bigint;
    emoji: string;
}
export enum Role {
    admin = "admin",
    user = "user"
}
export interface backendInterface {
    addActivity(dateKey: string, username: string, startTime: string, emoji: string, durationHours: bigint, note: string): Promise<bigint>;
    addUser(name: string, pin: string): Promise<void>;
    deleteActivity(activityId: bigint): Promise<boolean>;
    getActivitiesForDay(dateKey: string): Promise<Array<Activity>>;
    getUsers(): Promise<Array<[string, string]>>;
    joinActivity(existingActivityId: bigint, username: string): Promise<bigint>;
    login(pin: string): Promise<[string, Role]>;
    purgeOldActivities(todayKey: string): Promise<boolean>;
    removeUser(name: string): Promise<void>;
    updateActivityTime(activityId: bigint, newStartTime: string): Promise<boolean>;
}
