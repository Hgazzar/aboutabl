import type {
  LiveCompetitionHostPayload,
  LiveCompetitionPlayerAnswersReview,
} from "@/api/liveCompetitionsTeacherApi";

export type HostBoardDemoMode = "playing" | "ended";

function player(
  partial: LiveCompetitionHostPayload["players"][number]
): LiveCompetitionHostPayload["players"][number] {
  return partial;
}

/**
 * Local-only fixture so teachers can preview host board layout with filled ranking.
 * Not sent to the API.
 */
export function buildDemoHostBoard(
  mode: HostBoardDemoMode = "playing"
): LiveCompetitionHostPayload {
  const playing: LiveCompetitionHostPayload = {
    code: "DEMOHOST",
    status: "playing",
    type: "classic",
    goal: "comprehension",
    goal_label: "Comprehension",
    goal_hint: "Understanding the question",
    version: 12,
    question_total: 8,
    question_seconds: 20,
    team_mode: false,
    firewood: 3,
    firewood_needed: 4,
    fire_lit: false,
    active_event: "storm",
    event_title: "STORM!",
    event_body: "Wind stole a log. The campfire dims and everyone slips back.",
    firewall_active: false,
    bridge_broken: false,
    bridge_progress: 0,
    invited_total: 6,
    joined_total: 5,
    players: [
      player({
        id: 101,
        player_id: 1,
        rank: 1,
        name: "Sara Hassan",
        score: 7,
        coins: 48,
        streak: 4,
        progress: 88,
        avatar: null,
        power: "shield",
        power_used: true,
        shield: true,
        frozen: false,
        team: null,
        team_color: null,
        password_hint: null,
        reinforce: false,
        retry_queued: 0,
        answers_since_retry: 2,
      }),
      player({
        id: 102,
        player_id: 2,
        rank: 2,
        name: "Omar Ali",
        score: 6,
        coins: 35,
        streak: 2,
        progress: 75,
        avatar: null,
        power: "fifty_fifty",
        power_used: false,
        shield: false,
        frozen: false,
        team: null,
        team_color: null,
        password_hint: null,
        reinforce: true,
        retry_queued: 0,
        answers_since_retry: 1,
      }),
      player({
        id: 103,
        player_id: 3,
        rank: 3,
        name: "Lina Nour",
        score: 5,
        coins: 28,
        streak: 1,
        progress: 62,
        avatar: null,
        power: "freeze",
        power_used: true,
        shield: false,
        frozen: true,
        team: null,
        team_color: null,
        password_hint: null,
        reinforce: false,
        retry_queued: 1,
        answers_since_retry: 0,
      }),
      player({
        id: 104,
        player_id: 4,
        rank: 4,
        name: "Youssef Kamal",
        score: 4,
        coins: 22,
        streak: 0,
        progress: 50,
        avatar: null,
        power: null,
        power_used: false,
        shield: false,
        frozen: false,
        team: null,
        team_color: null,
        password_hint: null,
        reinforce: false,
        retry_queued: 0,
        answers_since_retry: 3,
      }),
      player({
        id: 105,
        player_id: 5,
        rank: 5,
        name: "Mariam Adel",
        score: 3,
        coins: 18,
        streak: 0,
        progress: 38,
        avatar: null,
        power: "shield",
        power_used: false,
        shield: false,
        frozen: false,
        team: null,
        team_color: null,
        password_hint: null,
        reinforce: true,
        retry_queued: 0,
        answers_since_retry: 0,
      }),
    ],
    teams: [],
    hardest: [
      {
        id: 1,
        question: "What does the word “campfire” mean in the story?",
        wrong: 4,
        correct: 1,
        total: 5,
        miss_rate: 80,
      },
      {
        id: 2,
        question: "Which detail shows the setting is at night?",
        wrong: 3,
        correct: 2,
        total: 5,
        miss_rate: 60,
      },
    ],
    fastest_name: "Sara Hassan",
    fastest_ms: 2400,
    fastest_id: 101,
    answers_total: 28,
    answers_correct: 21,
    class_accuracy: 75,
    seconds_left: 187,
    started_at: "2026-11-04 14:00:00",
    ends_at: "2026-11-04 14:10:00",
  };

  if (mode === "playing") {
    return playing;
  }

  return {
    ...playing,
    status: "ended",
    version: 20,
    seconds_left: 0,
    firewood: 4,
    fire_lit: true,
    active_event: null,
    event_title: null,
    event_body: null,
    class_accuracy: 78,
    answers_total: 40,
    answers_correct: 31,
    players: playing.players.map((p, index) => ({
      ...p,
      frozen: false,
      progress: Math.min(100, p.progress + 12 - index),
      score: Math.min(8, p.score + (index === 0 ? 1 : 0)),
    })),
  };
}

export function isHostBoardDemoMode(value: string | null): value is HostBoardDemoMode {
  return value === "playing" || value === "ended";
}

/**
 * Local-only answer review fixture for host demo drawer.
 * Not sent to the API. Keys match demo player `id` (student id).
 */
export function buildDemoPlayerAnswersReview(
  studentId: number
): LiveCompetitionPlayerAnswersReview | null {
  const board = buildDemoHostBoard("playing");
  const row = board.players.find((p) => p.id === studentId);
  if (!row) {
    return null;
  }

  const name = row.name;

  return {
    session: {
      id: 0,
      code: board.code,
      status: board.status,
      live_game_id: 1,
      class_id: 1,
    },
    student: {
      id: studentId,
      name,
      name_ar: name,
      photo: row.avatar ?? null,
    },
    player: {
      player_id: row.player_id,
      score: row.score,
      coins: row.coins,
      streak: row.streak,
      rank: row.rank,
    },
    questions: [
      {
        id: 1001,
        sort_order: 1,
        question: "What does the word “campfire” mean in the story?",
        image: null,
        voice_url: null,
        answer_type: "text",
        choices: ["A warm fire outdoors", "A cold wind", "A bridge", "A password"],
        correct_answer: "A warm fire outdoors",
        explanation: "Campfire is a fire for warmth outdoors.",
        answered: true,
        ever_correct: studentId === 101 || studentId === 102,
        attempts:
          studentId === 101
            ? [
                {
                  id: 1,
                  answer: "A warm fire outdoors",
                  correct: true,
                  timed_out: false,
                  is_retry: false,
                  is_reinforce: false,
                  attempt: 1,
                  elapsed_ms: 2400,
                  coins_delta: 3,
                  created_at: "2026-11-04 14:01:00",
                },
              ]
            : [
                {
                  id: 2,
                  answer: "A cold wind",
                  correct: false,
                  timed_out: false,
                  is_retry: false,
                  is_reinforce: false,
                  attempt: 1,
                  elapsed_ms: 5100,
                  coins_delta: 0,
                  created_at: "2026-11-04 14:01:10",
                },
                {
                  id: 3,
                  // Omar (102) gets it right on retry; others still miss on retry.
                  answer:
                    studentId === 102 ? "A warm fire outdoors" : "A bridge",
                  correct: studentId === 102,
                  timed_out: false,
                  is_retry: true,
                  is_reinforce: false,
                  attempt: 2,
                  elapsed_ms: 3200,
                  coins_delta: studentId === 102 ? 2 : 0,
                  created_at: "2026-11-04 14:02:00",
                },
              ],
      },
      {
        id: 1002,
        sort_order: 2,
        question: "Which detail shows the setting is at night?",
        image: null,
        voice_url: null,
        answer_type: "text",
        choices: ["Stars above the tents", "Morning birds", "Noon sun", "Breakfast"],
        correct_answer: "Stars above the tents",
        explanation: "Stars appear at night.",
        answered: studentId !== 105,
        ever_correct: studentId === 101 || studentId === 103,
        attempts:
          studentId === 105
            ? []
            : [
                {
                  id: 4,
                  answer:
                    studentId === 101 || studentId === 103
                      ? "Stars above the tents"
                      : "Morning birds",
                  correct: studentId === 101 || studentId === 103,
                  timed_out: studentId === 104,
                  is_retry: false,
                  is_reinforce: false,
                  attempt: 1,
                  elapsed_ms: studentId === 104 ? 20000 : 4100,
                  coins_delta: studentId === 101 || studentId === 103 ? 3 : 0,
                  created_at: "2026-11-04 14:03:00",
                },
              ],
      },
    ],
  };
}
