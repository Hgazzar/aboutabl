import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  LearningActivitySelection,
  storeLearningActivitiesAssignment,
} from "@/api/classAssignmentsApi";
import AssignmentMaterialsPanel from "@/components/teacher/class-details/assignments/AssignmentMaterialsPanel";
import LearningActivitiesPicker from "@/components/teacher/class-details/assignments/LearningActivitiesPicker";
import { WizardSelect } from "@/components/teacher/class-details/assignments/WizardSelect";
import { RootState } from "@/redux/store";
import { getRequest } from "@/utils/fetchMethods";
import { notify } from "@/utils/notify";
import {
  AssignmentMaterialItem,
  AssignmentMaterialKind,
} from "@/types/assignmentMaterials";
import { WizardClassOption } from "@/types/classAssignments";
import { ClassStudentsOverviewResponse } from "@/types/classStudentsOverview";

/** Local preview label only — materials are not persisted yet. */
const resolveMaterialLabel = (
  fileName: string,
  kind: AssignmentMaterialKind
): string => {
  if (kind === "voice") {
    return "VOICE";
  }
  if (kind === "link") {
    return "LINK";
  }
  const ext = fileName.split(".").pop()?.trim().toUpperCase();
  if (!ext || ext === fileName.toUpperCase()) {
    return "FILE";
  }
  return ext.slice(0, 8);
};

const BRAND = "#23B8A2";
const CHIP_VISIBLE_LIMIT = 3;

const MODAL_STYLE = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(640px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 48px)",
  overflow: "auto",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 3,
};

const ASSIGNMENT_TYPES = ["homework", "quiz", "practice", "worksheet"] as const;

type AssignmentUiType = (typeof ASSIGNMENT_TYPES)[number];

const STEP_KEYS = ["INFO", "MATERIALS", "REVIEW"] as const;

export type CreateAssignmentWizardModalProps = {
  open: boolean;
  classId: number;
  classes: WizardClassOption[];
  onClose: () => void;
  onCreated: () => void;
};

const fieldClassName =
  "w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:border-[#23B8A2]";

/**
 * LoginAdminResource exposes `school` (array), not always `school_id`.
 * Teachers resolve school from that list; fall back to school_id when present.
 */
const resolveSchoolId = (user: Record<string, unknown> | null | undefined): number => {
  const direct = Number(user?.school_id ?? 0);
  if (direct > 0) {
    return direct;
  }

  const schools = user?.school;
  if (Array.isArray(schools) && schools.length > 0) {
    const first = schools[0] as { id?: number | string };
    const fromList = Number(first?.id ?? 0);
    if (fromList > 0) {
      return fromList;
    }
  }

  if (schools && typeof schools === "object" && !Array.isArray(schools)) {
    const single = Number((schools as { id?: number | string }).id ?? 0);
    if (single > 0) {
      return single;
    }
  }

  return 0;
};

export const CreateAssignmentWizardModal = ({
  open,
  classId,
  classes,
  onClose,
  onCreated,
}: CreateAssignmentWizardModalProps) => {
  const { t } = useTranslation();
  const loginUser = useSelector((state: RootState) => state.login?.user);
  const schoolId = resolveSchoolId(loginUser as Record<string, unknown> | null);
  const teacherId = Number(loginUser?.id ?? 0);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [title, setTitle] = useState("");
  const [assignmentType, setAssignmentType] =
    useState<AssignmentUiType>("homework");
  const [selectedActivities, setSelectedActivities] = useState<
    LearningActivitySelection[]
  >([]);
  const [dueDate, setDueDate] = useState("");

  /** true → entire class payload (class_id[]); false → student_id[] */
  const [selectAllStudents, setSelectAllStudents] = useState(true);
  const [students, setStudents] = useState<
    { student_id: number; name: string }[]
  >([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [materials, setMaterials] = useState<AssignmentMaterialItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        value: String(item.class_id),
        label: item.label,
        avatarLetter: item.label.slice(0, 1).toUpperCase(),
      })),
    [classes]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase();
    if (!query) {
      return students;
    }
    return students.filter((student) =>
      student.name.toLocaleLowerCase().includes(query)
    );
  }, [studentSearch, students]);

  const selectedStudentChips = useMemo(() => {
    if (selectAllStudents) {
      return [];
    }
    return students.filter((student) =>
      selectedStudentIds.includes(student.student_id)
    );
  }, [selectAllStudents, selectedStudentIds, students]);

  const visibleChips = selectedStudentChips.slice(0, CHIP_VISIBLE_LIMIT);
  const hiddenChipCount = Math.max(
    0,
    selectedStudentChips.length - CHIP_VISIBLE_LIMIT
  );

  const studentCount = selectAllStudents
    ? students.length
    : selectedStudentIds.length;

  const filesCount = materials.filter((item) => item.kind !== "voice").length;
  const voiceCount = materials.filter((item) => item.kind === "voice").length;

  const stopMediaTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const revokeMaterialUrls = useCallback((items: AssignmentMaterialItem[]) => {
    items.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  }, []);

  const stopVoiceRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopMediaTracks();
      setIsRecording(false);
      mediaRecorderRef.current = null;
    }
  }, [stopMediaTracks]);

  const resetForm = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopMediaTracks();
    mediaRecorderRef.current = null;
    voiceChunksRef.current = [];
    setIsRecording(false);

    setMaterials((current) => {
      revokeMaterialUrls(current);
      return [];
    });

    setStep(0);
    setSubmitting(false);
    setSelectedClassId(classId);
    setTitle("");
    setAssignmentType("homework");
    setSelectedActivities([]);
    setDueDate("");
    setSelectAllStudents(true);
    setSelectedStudentIds([]);
    setStudentSearch("");
  }, [classId, revokeMaterialUrls, stopMediaTracks]);

  useEffect(() => {
    if (!open) {
      resetForm();
    } else {
      setSelectedClassId(classId);
    }
  }, [open, classId, resetForm]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      stopMediaTracks();
    };
  }, [stopMediaTracks]);

  useEffect(() => {
    if (!open || selectedClassId <= 0) {
      return;
    }

    let cancelled = false;

    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = (await getRequest(
          { range: "term", sort: "name", order: "asc" },
          `/api/dashboard/teacher/classes/${selectedClassId}/students-overview`
        )) as ClassStudentsOverviewResponse;

        if (cancelled) {
          return;
        }

        const rows = Array.isArray(response?.items) ? response.items : [];
        setStudents(
          rows.map((item) => ({
            student_id: item.student_id,
            name: item.name,
          }))
        );
        setSelectAllStudents(true);
        setSelectedStudentIds([]);
        setStudentSearch("");
      } catch {
        if (!cancelled) {
          setStudents([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingStudents(false);
        }
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [selectedClassId, open]);

  const handleAssignmentTypeChange = (value: string) => {
    setAssignmentType(value as AssignmentUiType);
  };

  const handleToggleAllStudents = (checked: boolean) => {
    setSelectAllStudents(checked);
    if (checked) {
      setSelectedStudentIds([]);
    }
  };

  const toggleStudent = (studentId: number) => {
    if (selectAllStudents) {
      // Leaving "All Students" — select everyone except the unchecked one.
      setSelectAllStudents(false);
      setSelectedStudentIds(
        students
          .map((student) => student.student_id)
          .filter((id) => id !== studentId)
      );
      return;
    }

    setSelectedStudentIds((current) => {
      const next = current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId];

      if (
        students.length > 0 &&
        next.length === students.length &&
        students.every((student) => next.includes(student.student_id))
      ) {
        setSelectAllStudents(true);
        return [];
      }

      return next;
    });
  };

  const isStudentChecked = (studentId: number): boolean =>
    selectAllStudents || selectedStudentIds.includes(studentId);

  const appendMaterials = useCallback(
    (
      items: Array<{
        kind: AssignmentMaterialKind;
        name: string;
        label?: string;
        previewUrl?: string;
      }>
    ) => {
      if (items.length === 0) {
        return;
      }

      setMaterials((current) => {
        const next = [...current];
        const stamp = Date.now();

        items.forEach((item, offset) => {
          const index =
            next.filter((row) => row.kind === item.kind).length + 1;
          next.push({
            id: `${item.kind}-${stamp}-${offset}-${index}`,
            kind: item.kind,
            label: item.label || resolveMaterialLabel(item.name, item.kind),
            name: item.name,
            previewUrl: item.previewUrl,
          });
        });

        return next;
      });
    },
    []
  );

  const openFilePicker = useCallback(() => {
    if (isRecording) {
      return;
    }
    fileInputRef.current?.click();
  }, [isRecording]);

  const handleLocalFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // Copy first — FileList is live and clears when input value is reset.
      const selected = Array.from(event.target.files ?? []);
      event.target.value = "";

      if (selected.length === 0) {
        return;
      }

      appendMaterials(
        selected.map((file) => ({
          kind: "file" as const,
          name: file.name,
        }))
      );
    },
    [appendMaterials]
  );

  const handleRecordVoice = useCallback(async () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_VOICE_UNSUPPORTED"),
        "error"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      voiceChunksRef.current = [];

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];
      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ||
        "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(voiceChunksRef.current, { type: blobType });
        voiceChunksRef.current = [];
        stopMediaTracks();
        mediaRecorderRef.current = null;
        setIsRecording(false);

        if (blob.size === 0) {
          notify(
            t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_VOICE_EMPTY"),
            "error"
          );
          return;
        }

        const extension = blobType.includes("mp4") ? "m4a" : "webm";
        setMaterials((current) => {
          const index =
            current.filter((item) => item.kind === "voice").length + 1;
          return [
            ...current,
            {
              id: `voice-${Date.now()}-${index}`,
              kind: "voice",
              label: t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_MATERIAL_VOICE"),
              name: t(
                "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_MATERIAL_VOICE_FILE",
                { index, extension }
              ),
              previewUrl: URL.createObjectURL(blob),
            },
          ];
        });
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      stopMediaTracks();
      setIsRecording(false);
      mediaRecorderRef.current = null;
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_VOICE_PERMISSION"),
        "error"
      );
    }
  }, [isRecording, stopMediaTracks, stopVoiceRecording, t]);

  const removeMaterial = (id: string) => {
    setMaterials((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const validateInfoStep = (): boolean => {
    if (schoolId <= 0) {
      notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SCHOOL_ERROR"), "error");
      return false;
    }

    if (!title.trim()) {
      notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_TITLE_REQUIRED"), "error");
      return false;
    }

    if (selectedActivities.length === 0) {
      notify(
        t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_REQUIRED"),
        "error"
      );
      return false;
    }

    if (!dueDate) {
      notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_DUE_DATE_REQUIRED"), "error");
      return false;
    }

    if (students.length === 0) {
      notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_NO_STUDENTS"), "error");
      return false;
    }

    if (!selectAllStudents && selectedStudentIds.length === 0) {
      notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SELECT_STUDENTS"), "error");
      return false;
    }

    return true;
  };

  const validateStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) {
      return validateInfoStep();
    }
    // Materials step is UI-only — always valid.
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return;
    }
    setStep((current) => Math.min(STEP_KEYS.length - 1, current + 1));
  };

  const handleBack = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const handleCreate = async () => {
    if (submitting) {
      return;
    }
    if (!validateInfoStep()) {
      setStep(0);
      return;
    }
    if (selectedActivities.length === 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        school_id: schoolId,
        title: title.trim(),
        subject_id: selectedActivities[0]?.subject_id,
        due_at: dueDate,
        teacher_id: teacherId > 0 ? teacherId : undefined,
        activities: selectedActivities.map((item) => ({
          activity_type: item.activity_type,
          activity_id: item.activity_id,
        })),
        ...(selectAllStudents
          ? { class_id: [selectedClassId] }
          : { student_id: selectedStudentIds }),
      };

      const response = await storeLearningActivitiesAssignment(payload);

      if (!response?.status) {
        throw new Error(
          response?.msg ||
            t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CREATE_ERROR")
        );
      }

      notify(t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CREATE_SUCCESS"), "success");
      onCreated();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CREATE_ERROR");
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatReviewDate = (value: string): string => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const stepLabels = STEP_KEYS.map((key) =>
    t(`TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_STEP_${key}`)
  );

  const targetReviewValue = selectAllStudents
    ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_ALL", {
        count: students.length,
      })
    : studentCount === 1
      ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_ONE")
      : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_MANY", {
          count: studentCount,
        });

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose}>
      <Box sx={MODAL_STYLE}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_TITLE")}
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUBTITLE")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-[#6B7280] disabled:opacity-50"
            aria-label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CANCEL")}
          >
            <HighlightOffRoundedIcon />
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          {stepLabels.map((label, index) => {
            const isActive = index === step;
            const isDone = index < step;
            return (
              <div
                key={STEP_KEYS[index]}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-[10px] px-2 py-2 text-xs font-semibold sm:text-sm ${
                  isActive
                    ? "bg-[#E6F8F5] text-[#0F766E]"
                    : isDone
                      ? "text-[#23B8A2]"
                      : "text-[#9CA3AF]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive || isDone
                      ? "bg-[#23B8A2] text-white"
                      : "bg-[#E5E7EB] text-[#6B7280]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate">{label}</span>
              </div>
            );
          })}
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <div className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_CLASS")}
              </span>
              <WizardSelect
                value={String(selectedClassId)}
                options={classOptions}
                placeholder={t(
                  "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SELECT_CLASS"
                )}
                disabled={submitting || classOptions.length === 0}
                onChange={(value) => setSelectedClassId(Number(value))}
                ariaLabel={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_CLASS")}
              />
            </div>

            <div className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_TARGET_LABEL")}
              </span>

              <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                {!selectAllStudents && selectedStudentChips.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {visibleChips.map((student) => (
                      <button
                        key={student.student_id}
                        type="button"
                        onClick={() => toggleStudent(student.student_id)}
                        disabled={submitting}
                        className="inline-flex items-center gap-1 rounded-full bg-[#E6F8F5] px-2.5 py-1 text-xs font-semibold text-[#0F766E]"
                      >
                        {student.name}
                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                      </button>
                    ))}
                    {hiddenChipCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#6B7280]">
                        {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CHIPS_MORE", {
                          count: hiddenChipCount,
                        })}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {selectAllStudents ? (
                  <div className="mb-3">
                    <span className="inline-flex items-center rounded-full bg-[#E6F8F5] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">
                      {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_ALL", {
                        count: students.length,
                      })}
                    </span>
                  </div>
                ) : null}

                <label className="relative mb-3 block">
                  <SearchRoundedIcon
                    sx={{
                      fontSize: 20,
                      color: "#9CA3AF",
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    disabled={submitting || loadingStudents}
                    placeholder={t(
                      "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SEARCH_STUDENTS"
                    )}
                    className="w-full rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 pl-10 pr-3 text-sm text-[#111827] outline-none focus:border-[#23B8A2] focus:bg-white"
                  />
                </label>

                {loadingStudents ? (
                  <div className="flex justify-center py-8">
                    <CircularProgress size={28} sx={{ color: BRAND }} />
                  </div>
                ) : students.length === 0 ? (
                  <p className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-8 text-center text-sm text-[#6B7280]">
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_NO_STUDENTS")}
                  </p>
                ) : filteredStudents.length === 0 ? (
                  <p className="rounded-[12px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-8 text-center text-sm text-[#6B7280]">
                    {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_NO_STUDENTS_FOUND")}
                  </p>
                ) : (
                  <ul className="max-h-48 overflow-auto rounded-[12px] border border-[#E5E7EB] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                    <li>
                      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC]">
                        <input
                          type="checkbox"
                          checked={selectAllStudents}
                          onChange={(event) =>
                            handleToggleAllStudents(event.target.checked)
                          }
                          disabled={submitting}
                        />
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[10px] font-bold text-[#4B5563]">
                          A
                        </span>
                        <span
                          className={`text-sm ${
                            selectAllStudents
                              ? "font-semibold text-[#0F766E]"
                              : "font-medium text-[#111827]"
                          }`}
                        >
                          {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_ALL_STUDENTS")}
                        </span>
                      </label>
                    </li>
                    {filteredStudents.map((student) => {
                      const checked = isStudentChecked(student.student_id);
                      return (
                        <li key={student.student_id}>
                          <label
                            className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC] ${
                              checked ? "bg-[#E6F8F5]" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStudent(student.student_id)}
                              disabled={submitting}
                            />
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[10px] font-bold text-[#4B5563]">
                              {(student.name || "?").slice(0, 1).toUpperCase()}
                            </span>
                            <span
                              className={`truncate text-sm ${
                                checked
                                  ? "font-semibold text-[#0F766E]"
                                  : "font-medium text-[#111827]"
                              }`}
                            >
                              {student.name}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <p className="mt-3 text-sm font-medium text-[#374151]">
                  {selectAllStudents
                    ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_ALL", {
                        count: students.length,
                      })
                    : studentCount === 1
                      ? t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_ONE")
                      : t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_SUMMARY_MANY", {
                          count: studentCount,
                        })}
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_TITLE")}
                <span className="text-[#DC2626]"> *</span>
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={submitting}
                placeholder={t(
                  "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_TITLE_PLACEHOLDER"
                )}
                className={fieldClassName}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#374151]">
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_ASSIGNMENT_TYPE")}
                </span>
                <WizardSelect
                  value={assignmentType}
                  options={ASSIGNMENT_TYPES.map((type) => ({
                    value: type,
                    label: t(
                      `TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_ASSIGNMENT_TYPE_${type.toUpperCase()}`
                    ),
                  }))}
                  placeholder={t(
                    "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_ASSIGNMENT_TYPE"
                  )}
                  disabled={submitting}
                  onChange={handleAssignmentTypeChange}
                />
              </div>
            </div>

            <div className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_BROWSER_TITLE")}
                <span className="text-[#DC2626]"> *</span>
              </span>
              <LearningActivitiesPicker
                schoolId={schoolId}
                selected={selectedActivities}
                onChange={setSelectedActivities}
                disabled={submitting}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#374151]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_DUE_DATE")}
                <span className="text-[#DC2626]"> *</span>
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={submitting}
                className={fieldClassName}
              />
            </label>
          </div>
        ) : null}

        {/* Keep mounted while modal is open so multi-select always lands in state. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          multiple
          onChange={handleLocalFileSelected}
          tabIndex={-1}
          aria-hidden
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        />

        {step === 1 ? (
          <AssignmentMaterialsPanel
            materials={materials}
            disabled={submitting}
            showHint
            layout="grid"
            isRecording={isRecording}
            onUpload={openFilePicker}
            onRecordVoice={handleRecordVoice}
            onAddMore={openFilePicker}
            onRemove={removeMaterial}
          />
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <h4 className="text-sm font-bold text-[#111827]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REVIEW_INFO")}
              </h4>
              <ReviewRow
                label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REVIEW_TITLE")}
                value={title.trim() || "—"}
              />
              <ReviewRow
                label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_BROWSER_TITLE")}
                value={
                  selectedActivities.length > 0
                    ? selectedActivities.map((item) => item.title).join(", ")
                    : "—"
                }
              />
              <ReviewRow
                label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_LA_SELECTED_COUNT", {
                  count: selectedActivities.length,
                  max: 10,
                })}
                value={`${selectedActivities.length}`}
              />
              <ReviewRow
                label={t(
                  "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REVIEW_DUE_DATE"
                )}
                value={dueDate ? formatReviewDate(dueDate) : "—"}
              />
              <ReviewRow
                label={t(
                  "TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_FIELD_ASSIGNMENT_TYPE"
                )}
                value={t(
                  `TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_ASSIGNMENT_TYPE_${assignmentType.toUpperCase()}`
                )}
              />
              <ReviewRow
                label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REVIEW_TARGET")}
                value={targetReviewValue}
              />
            </div>

            <div className="space-y-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <h4 className="text-sm font-bold text-[#111827]">
                {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_MATERIALS_TITLE")}
              </h4>
              <ReviewRow
                label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REVIEW_FILES")}
                value={String(filesCount)}
              />
              <ReviewRow
                label={t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_REVIEW_VOICE")}
                value={String(voiceCount)}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
            >
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_BACK")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-[10px] border border-[#E5E7EB] px-5 text-sm font-semibold text-[#374151] disabled:opacity-50"
            >
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CANCEL")}
            </button>
          )}

          {step < STEP_KEYS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="h-10 rounded-[10px] px-5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
            >
              {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_NEXT")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] px-5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
            >
              {submitting ? (
                <>
                  <CircularProgress size={18} sx={{ color: "#FFFFFF" }} />
                  {t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_WIZARD_CREATING")}
                </>
              ) : (
                t("TEACHER_CLASS_DETAILS.ASSIGNMENTS_CREATE")
              )}
            </button>
          )}
        </div>
      </Box>
    </Modal>
  );
};

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-[#6B7280]">{label}</span>
    <span className="max-w-[60%] text-right font-semibold text-[#111827]">
      {value}
    </span>
  </div>
);

