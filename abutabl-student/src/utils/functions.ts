/**
 * Converts aboutabl.com URLs to student.aboutabl.com for SCORM/iframe content in the student app.
 */
export const toStudentScormUrl = (url: string | undefined | null): string => {
    if (!url || typeof url !== 'string') return url ?? '';
    try {
        const u = new URL(url);
        if (u.hostname === 'aboutabl.com' || u.hostname === 'www.aboutabl.com') {
            u.hostname = 'student.aboutabl.com';
            return u.toString();
        }
        return url;
    } catch {
        return url;
    }
};

export const createFilterParam = (key: string, value: string | string[] | null) => {
    if (Array.isArray(value) && value.length > 0 && value.toString().trim()) {
        return { [key]: value.toString() };
    } else if (typeof value === 'string' && value.trim()) {
        return { [key]: value.trim() };
    } else {
        return {};
    }
};