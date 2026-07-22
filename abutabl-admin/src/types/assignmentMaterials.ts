export type AssignmentMaterialKind = "file" | "voice" | "link";

export type AssignmentMaterialItem = {
  id: string;
  kind: AssignmentMaterialKind;
  label: string;
  name: string;
  /** Local object URL for voice playback (not persisted). */
  previewUrl?: string;
};
