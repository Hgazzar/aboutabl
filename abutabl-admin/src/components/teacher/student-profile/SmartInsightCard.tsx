import { useState } from "react";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { useTranslation } from "react-i18next";
import {
  StudentProfileSmartInsight,
  StudentProfileSmartInsightCategoryGroup,
  StudentProfileSmartInsightExecutiveSummary,
  StudentProfileSmartInsightItem,
  StudentProfileSmartInsightRecommendation,
  StudentProfileSmartInsightTask,
} from "@/types/studentProfile";
import smartInsightIcon from "@/assets/smart-insight-icon.png";
import smartInsightRobot from "@/assets/smart-insight-robot.png";

export type SmartInsightCardProps = {
  smartInsight: StudentProfileSmartInsight;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
};

const TEAL = "#24B8A2";
const ORANGE = "#F37021";

const CATEGORY_ORDER = [
  "risk",
  "progress",
  "performance",
  "assessment",
  "standards",
  "learning_behaviour",
  "achievement",
];

const INSIGHT_HANDLED_KEYS = new Set([
  "id",
  "category",
  "severity",
  "title",
  "description",
  "recommendation",
  "recommendations",
  "priority",
  "priority_rank",
  "generated_at",
  "supporting_metrics",
  "confidence",
  "risk_indicators",
  "positive_findings",
  "weaknesses",
  "trend",
  "recommended_tasks",
  "tasks",
]);

const TOP_LEVEL_HANDLED = new Set([
  "available",
  "text",
  "generated_at",
  "insights",
  "recommended_tasks",
  "tasks",
  "executive_summary",
  "executive_score",
  "executive_level",
  "executive_confidence",
  "categories",
  "recommendations",
  "presentation_sections",
]);

const METRIC_SKIP_KEYS = new Set(["recommended_tasks", "tasks"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const humanizeKey = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "—";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatConfidence = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value <= 1) {
      return `${Math.round(value * 100)}%`;
    }
    return `${Math.round(value)}%`;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  if (raw.endsWith("%")) {
    return raw;
  }
  const asNum = Number(raw);
  if (Number.isFinite(asNum)) {
    if (asNum >= 0 && asNum <= 1) {
      return `${Math.round(asNum * 100)}%`;
    }
    return `${Math.round(asNum)}%`;
  }
  return raw;
};

const priorityBadgeStyle = (
  priority: unknown
): { background: string; color: string } => {
  const label = String(priority ?? "")
    .trim()
    .toLowerCase();
  if (label === "high" || label === "critical") {
    return { background: "#FEE2E2", color: "#B91C1C" };
  }
  if (label === "medium" || label === "warning") {
    return { background: "#FFEDD5", color: "#C2410C" };
  }
  if (label === "low" || label === "info" || label === "success") {
    return { background: "#D1FAE5", color: "#047857" };
  }
  return { background: "#E5E7EB", color: "#374151" };
};

const severityBadgeStyle = (
  severity: unknown
): { background: string; color: string } => {
  const label = String(severity ?? "")
    .trim()
    .toLowerCase();
  if (label === "critical" || label === "error" || label === "high") {
    return { background: "#FEE2E2", color: "#B91C1C" };
  }
  if (label === "warning" || label === "medium") {
    return { background: "#FFEDD5", color: "#C2410C" };
  }
  if (label === "success" || label === "info" || label === "low") {
    return { background: "#D1FAE5", color: "#047857" };
  }
  return { background: "#E5E7EB", color: "#374151" };
};

const asStringList = (value: unknown): string[] => {
  if (value === null || value === undefined || value === "") {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item).trim();
        }
        if (isRecord(item)) {
          return String(
            item.text ?? item.message ?? item.title ?? item.label ?? ""
          ).trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string" || typeof value === "number") {
    const s = String(value).trim();
    return s ? [s] : [];
  }
  return [];
};

const normalizeTask = (
  raw: Record<string, unknown>,
  index: number
): StudentProfileSmartInsightTask | null => {
  const title = String(
    raw.title ?? raw.name ?? raw.label ?? raw.task_title ?? ""
  ).trim();
  if (!title) {
    return null;
  }

  const dueRaw = raw.due ?? raw.due_date ?? raw.due_at ?? raw.deadline ?? null;
  const due =
    dueRaw === null || dueRaw === undefined || dueRaw === ""
      ? null
      : String(dueRaw);

  const detailUrlRaw = raw.detail_url ?? raw.url ?? raw.href ?? null;
  const detailUrl =
    detailUrlRaw === null || detailUrlRaw === undefined || detailUrlRaw === ""
      ? null
      : String(detailUrlRaw);

  const id = String(raw.id ?? `task-${index}-${title}`);

  return { id, title, due, detail_url: detailUrl };
};

export const extractRecommendedTasks = (
  smartInsight: StudentProfileSmartInsight
): StudentProfileSmartInsightTask[] => {
  const collected: StudentProfileSmartInsightTask[] = [];

  const pushList = (list: unknown) => {
    if (!Array.isArray(list)) {
      return;
    }
    list.forEach((item, index) => {
      if (!isRecord(item)) {
        return;
      }
      const task = normalizeTask(item, collected.length + index);
      if (task) {
        collected.push(task);
      }
    });
  };

  pushList(smartInsight.recommended_tasks);
  pushList(smartInsight.tasks);
  pushList(smartInsight.recommendations);

  (smartInsight.insights ?? []).forEach((insight) => {
    pushList(insight.recommended_tasks);
    pushList(insight.tasks);
    const metrics = insight.supporting_metrics;
    if (metrics && typeof metrics === "object") {
      pushList(
        (metrics as Record<string, unknown>).recommended_tasks ??
          (metrics as Record<string, unknown>).tasks
      );
    }
  });

  const seen = new Set<string>();
  return collected.filter((task) => {
    const key = `${task.id}|${task.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const MetaBadge = ({
  label,
  style,
}: {
  label: string;
  style: { background: string; color: string };
}) => (
  <span
    className="inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize"
    style={style}
  >
    {label}
  </span>
);

const InsightNarrative = ({
  insight,
}: {
  insight: StudentProfileSmartInsightItem;
}) => {
  const description = String(insight.description ?? "").trim();
  const recommendation = String(insight.recommendation ?? "").trim();
  const title = String(insight.title ?? "").trim();
  const observation = description || title;

  if (!observation && !recommendation) {
    return null;
  }

  return (
    <p className="text-[1.0625rem] font-medium italic leading-[1.55] text-[#1F2937] sm:text-[1.125rem] md:text-[1.1875rem]">
      {observation ? <span>{observation}</span> : null}
      {observation && recommendation ? <span> </span> : null}
      {recommendation ? (
        <span style={{ color: ORANGE }}>{recommendation}</span>
      ) : null}
    </p>
  );
};

const BulletList = ({
  title,
  items,
}: {
  title: string;
  items: string[];
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-semibold text-[#374151]">{title}</p>
      <ul className="list-disc space-y-1 pl-4">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="text-xs text-[#4B5563]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

function DynamicValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-[#9CA3AF]">—</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[#9CA3AF]">—</span>;
    }
    return (
      <ul className="list-disc space-y-0.5 pl-4">
        {value.map((item, index) => (
          <li key={index} className="text-xs text-[#4B5563]">
            {isRecord(item) ? (
              <DynamicObject entries={Object.entries(item)} />
            ) : (
              formatScalar(item)
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    return <DynamicObject entries={Object.entries(value)} />;
  }

  return <span className="text-xs text-[#4B5563]">{formatScalar(value)}</span>;
}

function DynamicObject({ entries }: { entries: [string, unknown][] }) {
  if (entries.length === 0) {
    return <span className="text-[#9CA3AF]">—</span>;
  }

  return (
    <dl className="grid gap-1.5 sm:grid-cols-2">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="rounded-lg border border-[#E5E7EB] bg-white/80 px-2.5 py-1.5"
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            {humanizeKey(key)}
          </dt>
          <dd className="mt-0.5 break-words">
            <DynamicValue value={val} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

const SupportingMetricsBlock = ({
  metrics,
  title,
}: {
  metrics: Record<string, unknown> | undefined;
  title: string;
}) => {
  if (!metrics || typeof metrics !== "object") {
    return null;
  }

  const entries = Object.entries(metrics).filter(
    ([key]) => !METRIC_SKIP_KEYS.has(key)
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-xs font-semibold text-[#374151]">{title}</p>
      <DynamicObject entries={entries} />
    </div>
  );
};

const InsightDetailPanel = ({
  insight,
}: {
  insight: StudentProfileSmartInsightItem;
}) => {
  const { t } = useTranslation();
  const category = String(insight.category ?? "").trim();
  const severity = String(insight.severity ?? "").trim();
  const priority =
    insight.priority === null || insight.priority === undefined
      ? ""
      : String(insight.priority).trim();
  const title = String(insight.title ?? "").trim();
  const description = String(insight.description ?? "").trim();
  const recommendation = String(insight.recommendation ?? "").trim();
  const recommendationList = asStringList(insight.recommendations);
  const recommendations =
    recommendation && !recommendationList.includes(recommendation)
      ? [recommendation, ...recommendationList]
      : recommendationList;
  const confidence = formatConfidence(insight.confidence);
  const trend = String(insight.trend ?? "").trim();
  const generatedAt = String(insight.generated_at ?? "").trim();
  const risks = asStringList(insight.risk_indicators);
  const positives = asStringList(insight.positive_findings);
  const weaknesses = asStringList(insight.weaknesses);

  const unknownEntries = Object.entries(insight).filter(([key, value]) => {
    if (INSIGHT_HANDLED_KEYS.has(key)) {
      return false;
    }
    return value !== undefined;
  });

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {title ? (
            <p className="text-sm font-semibold text-[#111827]">{title}</p>
          ) : null}
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {category ? (
            <MetaBadge
              label={category}
              style={{ background: "#E0F2FE", color: "#0369A1" }}
            />
          ) : null}
          {severity ? (
            <MetaBadge label={severity} style={severityBadgeStyle(severity)} />
          ) : null}
          {priority ? (
            <MetaBadge label={priority} style={priorityBadgeStyle(priority)} />
          ) : null}
          {confidence ? (
            <MetaBadge
              label={`${t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_CONFIDENCE")}: ${confidence}`}
              style={{ background: "#F3E8FF", color: "#7E22CE" }}
            />
          ) : null}
          {trend ? (
            <MetaBadge
              label={trend}
              style={{ background: "#ECFDF5", color: "#047857" }}
            />
          ) : null}
        </div>
      </div>

      <BulletList
        title={t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_RECOMMENDATIONS")}
        items={recommendations}
      />
      <BulletList
        title={t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_RISKS")}
        items={risks}
      />
      <BulletList
        title={t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_POSITIVES")}
        items={positives}
      />
      <BulletList
        title={t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_WEAKNESSES")}
        items={weaknesses}
      />

      <SupportingMetricsBlock
        metrics={
          insight.supporting_metrics &&
          typeof insight.supporting_metrics === "object"
            ? (insight.supporting_metrics as Record<string, unknown>)
            : undefined
        }
        title={t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_SUPPORTING_METRICS")}
      />

      {unknownEntries.length > 0 ? (
        <div className="mt-2">
          <p className="mb-1.5 text-xs font-semibold text-[#374151]">
            {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_ADDITIONAL_FIELDS")}
          </p>
          <DynamicObject entries={unknownEntries} />
        </div>
      ) : null}

      {generatedAt ? (
        <p className="mt-2 text-[10px] text-[#9CA3AF]">
          {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_GENERATED_AT", {
            value: generatedAt,
          })}
        </p>
      ) : null}
    </div>
  );
};

const CategoryAccordion = ({
  group,
  defaultOpen,
}: {
  group: StudentProfileSmartInsightCategoryGroup;
  defaultOpen: boolean;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const [showCollapsed, setShowCollapsed] = useState(false);
  const label = String(group.category ?? "general");
  const visible = Array.isArray(group.visible)
    ? group.visible
    : Array.isArray(group.insights)
      ? group.insights.slice(0, 5)
      : [];
  const collapsed = Array.isArray(group.collapsed) ? group.collapsed : [];
  const collapsedCount =
    typeof group.collapsed_count === "number"
      ? group.collapsed_count
      : collapsed.length;
  const rendered = showCollapsed ? [...visible, ...collapsed] : visible;
  const total =
    (Array.isArray(group.insights) ? group.insights.length : 0) ||
    visible.length + collapsed.length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white/70">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="text-xs font-bold capitalize text-[#111827]">
          {humanizeKey(label)}
          <span className="ml-2 font-medium text-[#9CA3AF]">({total})</span>
        </span>
        <span
          className="inline-block text-sm text-[#6B7280] transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-[#E5E7EB] px-2.5 py-2.5">
          {rendered.map((insight, index) => (
            <InsightDetailPanel
              key={String(insight.id ?? `${label}-${index}`)}
              insight={insight}
            />
          ))}
          {collapsedCount > 0 ? (
            <button
              type="button"
              className="w-full rounded-lg border border-dashed border-[#D1D5DB] px-3 py-2 text-xs font-semibold text-[#24B8A2]"
              onClick={() => setShowCollapsed((prev) => !prev)}
            >
              {showCollapsed
                ? t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_SHOW_LESS")
                : group.more_label ||
                  t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_MORE", {
                    count: collapsedCount,
                  })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const ExecutiveSummaryPanel = ({
  summary,
  text,
  score,
  level,
  confidence,
}: {
  summary: StudentProfileSmartInsightExecutiveSummary | null | undefined;
  text: string;
  score: number | null | undefined;
  level: string | null | undefined;
  confidence: number | null | undefined;
}) => {
  const { t } = useTranslation();
  const rows: { label: string; value: string }[] = [];
  if (summary) {
    const pairs: [string, unknown][] = [
      [
        t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_OVERALL_STATUS"),
        summary.overall_student_status,
      ],
      [
        t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_STRONGEST_POSITIVE"),
        summary.strongest_positive_finding,
      ],
      [
        t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_HIGHEST_CONCERN"),
        summary.highest_priority_concern,
      ],
      [
        t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_TEACHER_FOCUS"),
        summary.teacher_focus_area,
      ],
      [
        t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_IMMEDIATE_ACTION"),
        summary.immediate_recommended_action,
      ],
    ];
    pairs.forEach(([label, value]) => {
      const v = String(value ?? "").trim();
      if (v) {
        rows.push({ label, value: v });
      }
    });
  }

  const conf =
    formatConfidence(summary?.overall_confidence ?? confidence) ?? null;
  const scoreLabel =
    typeof score === "number" && Number.isFinite(score)
      ? score.toFixed(2)
      : null;
  const levelLabel = String(level ?? "").trim();

  if (rows.length === 0 && !text && !scoreLabel) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-[#E5E7EB]/60 bg-white/60 px-3 py-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_EXECUTIVE_SUMMARY")}
      </p>
      {(scoreLabel || levelLabel || conf) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {scoreLabel ? (
            <MetaBadge
              label={`${t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_EXECUTIVE_SCORE")}: ${scoreLabel}`}
              style={{ background: "#E0F2FE", color: "#0369A1" }}
            />
          ) : null}
          {levelLabel ? (
            <MetaBadge
              label={`${t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_EXECUTIVE_LEVEL")}: ${levelLabel}`}
              style={{ background: "#F3E8FF", color: "#7E22CE" }}
            />
          ) : null}
          {conf ? (
            <MetaBadge
              label={`${t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_OVERALL_CONFIDENCE")}: ${conf}`}
              style={{ background: "#ECFDF5", color: "#047857" }}
            />
          ) : null}
        </div>
      )}
      {rows.length > 0 ? (
        <dl className="space-y-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                {row.label}
              </dt>
              <dd className="text-sm leading-relaxed text-[#374151]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : text ? (
        <p className="text-sm leading-relaxed text-[#374151]">{text}</p>
      ) : null}
    </div>
  );
};

const CalibratedRecommendations = ({
  recommendations,
}: {
  recommendations: StudentProfileSmartInsightRecommendation[];
}) => {
  const { t } = useTranslation();
  if (recommendations.length === 0) {
    return null;
  }

  const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  const grouped = new Map<string, StudentProfileSmartInsightRecommendation[]>();
  recommendations.forEach((rec) => {
    const cat = String(rec.category ?? "general").trim() || "general";
    if (!grouped.has(cat)) {
      grouped.set(cat, []);
    }
    grouped.get(cat)!.push(rec);
  });

  const categories = Array.from(grouped.keys()).sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : 100;
    const ib = order.has(b) ? (order.get(b) as number) : 100;
    if (ia !== ib) {
      return ia - ib;
    }
    return a.localeCompare(b);
  });

  return (
    <div className="mt-5">
      <h3 className="mb-3 text-[0.9375rem] font-bold text-[#111827]">
        {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_CALIBRATED_RECOMMENDATIONS")}
      </h3>
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              {humanizeKey(category)}
            </p>
            <ul className="flex flex-col gap-2">
              {(grouped.get(category) ?? []).map((rec, index) => (
                <li
                  key={`${category}-${String(rec.action_type ?? "rec")}-${index}`}
                  className="rounded-[12px] border border-[#E5E7EB] bg-white px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#111827]">
                      {String(rec.title ?? "").trim()}
                    </p>
                    {rec.priority ? (
                      <MetaBadge
                        label={String(rec.priority)}
                        style={priorityBadgeStyle(rec.priority)}
                      />
                    ) : null}
                  </div>
                  {rec.description ? (
                    <p className="mt-1 text-xs text-[#4B5563]">
                      {String(rec.description)}
                    </p>
                  ) : null}
                  {rec.due_hint ? (
                    <p className="mt-1 text-[10px] text-[#9CA3AF]">
                      {t("TEACHER_STUDENT_PROFILE.DUE")}: {String(rec.due_hint)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecommendedTasksList = ({
  tasks,
}: {
  tasks: StudentProfileSmartInsightTask[];
}) => {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h3 className="mb-3 text-[0.9375rem] font-bold text-[#111827]">
        {t("TEACHER_STUDENT_PROFILE.RECOMMENDATIONS")}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">
                {task.title}
              </p>
              {task.due ? (
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  {t("TEACHER_STUDENT_PROFILE.DUE")}: {task.due}
                </p>
              ) : null}
            </div>
            {task.detail_url ? (
              <a
                href={task.detail_url}
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white no-underline"
                style={{ backgroundColor: TEAL }}
              >
                {t("TEACHER_STUDENT_PROFILE.DETAILS")}
              </a>
            ) : (
              <span
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: TEAL }}
              >
                {t("TEACHER_STUDENT_PROFILE.DETAILS")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const resolveCategoryGroups = (
  smartInsight: StudentProfileSmartInsight,
  insights: StudentProfileSmartInsightItem[]
): StudentProfileSmartInsightCategoryGroup[] => {
  if (
    Array.isArray(smartInsight.categories) &&
    smartInsight.categories.length > 0
  ) {
    return smartInsight.categories;
  }

  const map = new Map<string, StudentProfileSmartInsightItem[]>();
  insights.forEach((insight) => {
    const category = String(insight.category ?? "general").trim() || "general";
    if (!map.has(category)) {
      map.set(category, []);
    }
    map.get(category)!.push(insight);
  });

  const ordered = [
    ...CATEGORY_ORDER.filter((c) => map.has(c)),
    ...Array.from(map.keys()).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return ordered.map((category) => {
    const all = map.get(category) ?? [];
    const visible = all.slice(0, 5);
    const collapsed = all.slice(5);
    return {
      category,
      insights: all,
      visible,
      collapsed,
      collapsed_count: collapsed.length,
      more_label: collapsed.length > 0 ? `+ ${collapsed.length} More` : null,
    };
  });
};

function SmartInsightCard({
  smartInsight,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: SmartInsightCardProps) {
  const { t } = useTranslation();
  const insights = (() => {
    const raw = Array.isArray(smartInsight?.insights)
      ? smartInsight.insights
      : [];
    const seen = new Set<string>();
    return raw.filter((insight) => {
      const id = String(insight?.id ?? "").trim();
      const key = id || JSON.stringify(insight);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  })();
  const hasInsights = Boolean(smartInsight?.available) && insights.length > 0;
  const narrativeCandidates = hasInsights
    ? insights.filter((insight) => {
        const description = String(insight.description ?? "").trim();
        const recommendation = String(insight.recommendation ?? "").trim();
        const title = String(insight.title ?? "").trim();
        return Boolean(description || recommendation || title);
      })
    : [];
  const primary = narrativeCandidates[0] ?? null;
  const additionalNarratives = narrativeCandidates.slice(1, 3);
  const tasks = extractRecommendedTasks(
    smartInsight ?? {
      available: false,
      text: null,
      generated_at: null,
      insights: [],
    }
  );
  const calibratedRecs = Array.isArray(smartInsight?.recommendations)
    ? smartInsight.recommendations
    : [];
  const showLoading = isLoading && !hasInsights;
  const showError = isError && !hasInsights;

  const executiveText = String(smartInsight?.text ?? "").trim();
  const panelGeneratedAt = String(smartInsight?.generated_at ?? "").trim();
  const grouped = hasInsights
    ? resolveCategoryGroups(smartInsight, insights)
    : [];
  const sections = Array.isArray(smartInsight?.presentation_sections)
    ? smartInsight.presentation_sections
    : [];

  /** Collapsed by default — avoids looking like a second Smart Insight block. */
  const [detailsOpen, setDetailsOpen] = useState(false);

  const topLevelUnknown = (() => {
    if (!smartInsight || !hasInsights) {
      return [];
    }
    return Object.entries(smartInsight).filter(([key, value]) => {
      if (TOP_LEVEL_HANDLED.has(key)) {
        return false;
      }
      return value !== undefined && value !== null;
    });
  })();

  return (
    <article className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-5 shadow-[0_4px_6px_rgba(0,0,0,0.05)] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[#111827]">
          <img
            src={smartInsightIcon}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 object-contain"
            aria-hidden="true"
          />
          <h2 className="text-[1.0625rem] font-bold leading-tight text-[#111827]">
            {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT")}
          </h2>
        </div>
        <FormatQuoteIcon sx={{ fontSize: 34, color: TEAL }} />
      </div>

      {showLoading ? (
        <div
          className="flex flex-1 flex-col justify-center rounded-2xl bg-[#F6F9F7] px-4 py-10"
          aria-busy="true"
        >
          <div className="mx-auto mb-3 h-20 w-full max-w-sm animate-pulse rounded-xl bg-[#E5E7EB]" />
          <div className="mx-auto h-16 w-full max-w-sm animate-pulse rounded-xl bg-[#E5E7EB]" />
          <p className="mt-4 text-center text-xs text-[#9CA3AF]">
            {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_LOADING")}
          </p>
        </div>
      ) : showError ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#B91C1C]">
            {errorMessage ||
              t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_LOAD_ERROR")}
          </p>
        </div>
      ) : !hasInsights ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-[#F6F9F7] px-4 py-10 text-center">
          <p className="text-sm font-medium text-[#6B7280]">
            {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_UNAVAILABLE")}
          </p>
        </div>
      ) : (
        <div className="relative flex max-h-[70vh] flex-1 flex-col overflow-y-auto rounded-2xl bg-[#F6F9F7] px-4 pb-4 pt-5 sm:max-h-none sm:px-5 sm:pb-5 sm:pt-6">
          {isLoading ? (
            <p className="mb-2 text-xs text-[#9CA3AF]">
              {t("TEACHER_STUDENT_PROFILE.REFRESHING")}
            </p>
          ) : null}

          {primary ? (
            <div className="relative z-[1] min-h-[8.5rem] pr-[5.75rem] sm:pr-[6.75rem] md:pr-[7.5rem]">
              <InsightNarrative insight={primary} />
              {additionalNarratives.map((insight, index) => (
                <div
                  key={String(insight.id ?? `narrative-${index}`)}
                  className="mt-3"
                >
                  <InsightNarrative insight={insight} />
                </div>
              ))}
              <div className="pointer-events-none absolute -right-1 top-1/2 w-[5.75rem] -translate-y-[42%] sm:-right-0.5 sm:w-[6.5rem] md:w-[7.25rem]">
                <img
                  src={smartInsightRobot}
                  alt=""
                  className="h-auto w-full drop-shadow-sm"
                />
              </div>
            </div>
          ) : null}

          <ExecutiveSummaryPanel
            summary={smartInsight.executive_summary}
            text={executiveText}
            score={smartInsight.executive_score}
            level={smartInsight.executive_level}
            confidence={smartInsight.executive_confidence}
          />

          {panelGeneratedAt ? (
            <p className="mt-2 text-[10px] text-[#9CA3AF]">
              {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_GENERATED_AT", {
                value: panelGeneratedAt,
              })}
            </p>
          ) : null}

          {sections.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                {t(
                  "TEACHER_STUDENT_PROFILE.SMART_INSIGHT_PRESENTATION_SECTIONS"
                )}
              </p>
              <div className="space-y-2">
                {sections.map((section, index) => {
                  const title = String(section.title ?? "").trim();
                  const summary = String(section.summary ?? "").trim();
                  if (!title && !summary) {
                    return null;
                  }
                  return (
                    <div
                      key={String(section.id ?? `section-${index}`)}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5"
                    >
                      {title ? (
                        <p className="text-sm font-semibold text-[#111827]">
                          {title}
                        </p>
                      ) : null}
                      {summary ? (
                        <p className="mt-1 text-xs text-[#4B5563]">{summary}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between gap-2 text-left"
              onClick={() => setDetailsOpen((prev) => !prev)}
              aria-expanded={detailsOpen}
            >
              <h3 className="text-[0.9375rem] font-bold text-[#111827]">
                {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_ALL_INSIGHTS")}
                <span className="ml-2 text-xs font-medium text-[#9CA3AF]">
                  ({insights.length})
                </span>
              </h3>
              <span className="text-xs font-semibold text-[#24B8A2]">
                {detailsOpen
                  ? t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_SHOW_LESS")
                  : t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_SHOW_MORE")}
              </span>
            </button>

            {detailsOpen ? (
              <div className="space-y-2">
                {grouped.map((group, index) => (
                  <CategoryAccordion
                    key={String(group.category)}
                    group={group}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {topLevelUnknown.length > 0 ? (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-[#374151]">
                {t("TEACHER_STUDENT_PROFILE.SMART_INSIGHT_ADDITIONAL_FIELDS")}
              </p>
              <DynamicObject entries={topLevelUnknown} />
            </div>
          ) : null}

          <CalibratedRecommendations recommendations={calibratedRecs} />
          {calibratedRecs.length === 0 ? (
            <RecommendedTasksList tasks={tasks} />
          ) : null}
        </div>
      )}
    </article>
  );
}

export default SmartInsightCard;
