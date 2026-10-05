import { type State } from "./model";
import { seed } from "./seed";
export const STORAGE_KEY = "northstar-recruitment-demo-v1";
export function loadDemo(storage: Pick<Storage, "getItem">) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1 && parsed.data && parsed.settings)
        return { state: parsed, error: "" };
    }
    return { state: seed(), error: "" };
  } catch {
    return {
      state: seed(),
      error:
        "Browser storage unavailable. Changes remain in memory for this visit.",
    };
  }
}
export function persistDemo(state: State, storage: Pick<Storage, "setItem">) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return "";
  } catch {
    return "Browser storage unavailable or full. Changes remain in memory; export before closing.";
  }
}
