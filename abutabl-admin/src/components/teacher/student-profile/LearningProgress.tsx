import { StudentProfileLearningProgress } from "@/types/studentProfile";
import LearningProgressCard from "@/components/teacher/shared/LearningProgressCard";

export type LearningProgressProps = {
  learningProgress?: StudentProfileLearningProgress | null;
};

/**
 * Student Profile / Students Tab — student-scope Learning Progress.
 * Reuses shared card; data from profile.learning_progress (same SSOT as Overview).
 */
export const LearningProgress = ({ learningProgress }: LearningProgressProps) => (
  <LearningProgressCard data={learningProgress} />
);

export default LearningProgress;
