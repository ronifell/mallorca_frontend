/** Shared flag so axios interceptors can avoid re-entering logout on 401. */
let logoutInFlight: Promise<void> | null = null;

export function isLogoutInFlight(): boolean {
  return logoutInFlight !== null;
}

export function getLogoutInFlight(): Promise<void> | null {
  return logoutInFlight;
}

export function setLogoutInFlight(promise: Promise<void> | null): void {
  logoutInFlight = promise;
}
