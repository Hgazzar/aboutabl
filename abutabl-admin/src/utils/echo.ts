import Echo from "laravel-echo";
import Pusher from "pusher-js";
import Cookies from "js-cookie";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Pusher = Pusher;

function broadcastingRootUrl(): string {
  const base = (process.env.REACT_APP_BASE_URL || "").replace(/\/+$/, "");
  return base.replace(/\/api\/?$/, "");
}

/**
 * Laravel Echo (Pusher protocol) for private/presence channels.
 * Matches backend auth: `apiSecret` + `Authorizations: Bearer …` on `/broadcasting/auth`.
 */
export function createAdminEcho() {
  const root = broadcastingRootUrl();

  return new Echo({
    broadcaster: "pusher",
    key: process.env.REACT_APP_PUSHER_APP_KEY || process.env.REACT_APP_PUSHER_KEY || "",
    cluster: process.env.REACT_APP_PUSHER_APP_CLUSTER || "mt1",
    wsHost: process.env.REACT_APP_PUSHER_HOST || "127.0.0.1",
    wsPort: Number(process.env.REACT_APP_PUSHER_PORT || 6001),
    wssPort: Number(process.env.REACT_APP_PUSHER_PORT || 6001),
    forceTLS: (process.env.REACT_APP_PUSHER_SCHEME || "http") === "https",
    encrypted: (process.env.REACT_APP_PUSHER_SCHEME || "http") === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${root}/broadcasting/auth`,
    auth: {
      headers: {
        apiSecret: process.env.REACT_APP_API_SECRET || "",
        Authorizations: `Bearer ${Cookies.get("token_") || ""}`,
      },
    },
  });
}
