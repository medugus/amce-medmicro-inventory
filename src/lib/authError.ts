// Typed error thrown when an action requires a selected user but none is set.
// UI layers can detect this and prompt the user picker instead of showing a
// generic toast.

export class AuthRequiredError extends Error {
  readonly name = "AuthRequiredError";
  constructor(message = "Select a user in the top bar before recording actions.") {
    super(message);
  }
}

export function isAuthRequiredError(err: unknown): err is AuthRequiredError {
  return err instanceof AuthRequiredError || (typeof err === "object" && err !== null && (err as { name?: string }).name === "AuthRequiredError");
}

/** Dispatch a global event the UserPicker listens to so it opens its dialog. */
export function requestUserPicker() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("amce:request-user-picker"));
}

/**
 * Wrap an async action. If it throws AuthRequiredError, opens the picker and
 * returns null. Other errors are re-thrown so callers can toast them.
 */
export async function withAuthPrompt<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (isAuthRequiredError(err)) {
      requestUserPicker();
      return null;
    }
    throw err;
  }
}
