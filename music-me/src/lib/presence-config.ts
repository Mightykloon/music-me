// Presence timings, shared by the browser heartbeat and the server (lib/presence.ts).

/** how often an open tab checks in */
export const HEARTBEAT_MS = 2 * 60 * 1000;
/** seen this recently counts as online (a little over two missed heartbeats) */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
