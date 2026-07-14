import {
  ClassDetailsLearningProgress,
} from "@/types/classDetailsOverview";
import LearningProgressCard from "@/components/teacher/shared/LearningProgressCard";

export type ClassLearningProgressProps = {
  learningProgress?: ClassDetailsLearningProgress | null;
};

/** Class Overview wrapper — class scope data; shared card UI. */
export const ClassLearningProgress = ({
  learningProgress,
}: ClassLearningProgressProps) => (
  <LearningProgressCard data={learningProgress} withSection />
);

export default ClassLearningProgress;
