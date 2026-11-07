import { InteractiveGamesPageShell } from "./InteractiveGamesPageShell";
import InteractiveGamesPicker from "./InteractiveGamesPicker";

/**
 * Backward-compatible Interactive Games waiting-room picker.
 * Not the Live Competitions catalog — interactive_games IDs only.
 */
export default function LegacyInteractiveGamesPage() {
  return (
    <InteractiveGamesPageShell
      title="Legacy Interactive Games"
      subtitle="Waiting-room classroom tools for interactive_games. Prefer Live competitions (/live-games) for new classroom sessions."
      crumbs={[
        { label: "Live games", to: "/games" },
        { label: "Legacy Interactive Games" },
      ]}
    >
      <InteractiveGamesPicker />
    </InteractiveGamesPageShell>
  );
}
