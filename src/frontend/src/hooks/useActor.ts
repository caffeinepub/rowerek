import { useActor as useCoreActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";

export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return useCoreActor<backendInterface>(
    createActor as Parameters<typeof useCoreActor<backendInterface>>[0],
  );
}
