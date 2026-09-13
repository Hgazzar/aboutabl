/** Domain types for viewSubject payload used by Book Details (kFrame-BookDetails). */

export type ViewSubjectContent = {
	id: number;
	name: string;
	path?: string;
	type?: string;
	period?: string;
};

export type ViewSubjectQuiz = {
	id: number;
	title: string;
};

export type ViewSubjectLesson = {
	id: number;
	name: string;
	contents: ViewSubjectContent[];
	quizesLesson: ViewSubjectQuiz[];
};

export type ViewSubjectUnit = {
	id: number;
	name: string;
	for_teacher?: number | string | boolean;
	lessons_count?: number;
	quizes_count?: number;
	lessons: ViewSubjectLesson[];
	quizesUnit: ViewSubjectQuiz[];
};

export type ViewSubjectWorksheet = {
	id: number;
	title: string;
	file_url: string;
};

export type ViewSubjectBasicInfo = {
	id: number;
	name: string;
	des?: string | null;
	photo?: string | null;
	lessons_count?: number;
	units_count?: number;
	quizes_count?: number;
	games_count?: number;
	work_sheets_count?: number;
};

export type ViewSubjectPayload = {
	status?: boolean;
	basic_info?: ViewSubjectBasicInfo;
	units?: ViewSubjectUnit[];
	quizesSubject?: ViewSubjectQuiz[];
	worksheetsSubject?: ViewSubjectWorksheet[];
};

export type CurriculumGameItem = {
	id: number;
	name: string;
	background?: string | null;
	progress?: number | string | null;
};

export type TimelineActivityKind = 'lesson_content' | 'quiz' | 'worksheet' | 'game';

export type TimelineActivity = {
	key: string;
	kind: TimelineActivityKind;
	title: string;
	/** In-app path or external URL */
	href: string;
	external: boolean;
	/** Visual theme cycle index */
	themeIndex: number;
};
