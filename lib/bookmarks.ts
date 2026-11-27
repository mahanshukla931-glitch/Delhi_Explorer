import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";
import { LandmarkLocation } from "@/types/map";

const BOOKMARKS_STORAGE_KEY = "delhi_saved_places";

export function getSavedLandmarkIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read saved places from localStorage:", err);
    return [];
  }
}

export function isLandmarkSaved(id: string): boolean {
  return getSavedLandmarkIds().includes(id);
}

export function toggleLandmarkSaved(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getSavedLandmarkIds();
    let updated: string[];
    let isNowSaved = false;

    if (current.includes(id)) {
      updated = current.filter((item) => item !== id);
      isNowSaved = false;
    } else {
      updated = [...current, id];
      isNowSaved = true;
    }

    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global custom event for instant cross-component updates
    window.dispatchEvent(
      new CustomEvent("delhi_bookmarks_changed", {
        detail: { id, isNowSaved, allSavedIds: updated },
      })
    );

    return isNowSaved;
  } catch (err) {
    console.error("Failed to toggle bookmark in localStorage:", err);
    return false;
  }
}

export function getSavedLandmarks(): LandmarkLocation[] {
  const ids = getSavedLandmarkIds();
  return DELHI_PRIMARY_LANDMARKS.filter((l) => ids.includes(l.id));
}
