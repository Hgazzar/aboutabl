export type AssignmentMaterialKind = "file" | "voice" | "link";

export type AssignmentMaterialItem = {
  id: string;
  kind: AssignmentMaterialKind;
  label: string;
  name: string;
  /** Local object URL for voice playback (not persisted SSOT). */
  previewUrl?: string;
  /** Retained for upload after assignment create (file/voice). */
  file?: File;
  /** External URL for link materials. */
  url?: string;
};
