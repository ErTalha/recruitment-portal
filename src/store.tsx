import { createContext, useContext, useState, type ReactNode } from "react";
import { type State } from "./model";
import { seed } from "./seed";
import { loadDemo, persistDemo } from "./persistence";
function initial() {
  try {
    return loadDemo(localStorage);
  } catch {
    return {
      state: seed(),
      error:
        "Browser storage unavailable. Changes remain in memory for this visit.",
    };
  }
}
const Context = createContext<{
  state: State;
  error: string;
  run: (fn: (s: State) => void) => void;
  reset: () => void;
}>({} as never);
export function Provider({ children }: { children: ReactNode }) {
  const [start] = useState(initial);
  const [state, setState] = useState(start.state);
  const [error, setError] = useState(start.error);
  function commit(next: State) {
    setState(next);
    try {
      setError(persistDemo(next, localStorage));
    } catch {
      setError(
        "Browser storage unavailable. Changes remain in memory for this visit.",
      );
    }
  }
  function run(fn: (s: State) => void) {
    const next = structuredClone(state);
    fn(next);
    commit(next);
  }
  return (
    <Context.Provider
      value={{ state, error, run, reset: () => commit(seed()) }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
