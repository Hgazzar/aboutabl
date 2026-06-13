import Quill from "quill";
import React, { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";

const Align = Quill.import("formats/align") as any;
Align.whitelist = ["left", "center", "right"]; // Allow only left, center, and right alignment

Quill.register(Align, true);

const TextEditor = ({
  placeholder = "",
  formik,
  id,
  height = "100px",
  initialValue,
}: any) => {
  const [editorValue, setEditorValue] = useState("");
  const modules = {
    toolbar: [
      ["italic", "bold", "underline"],
      [{ align: [] }],
      ["link", "image", "video"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };
  const formats = ["italic", "bold", "underline", "align", "link", "image", "video"];

  //   ----------- functions -------------
  const isUpdatingFromFormik = useRef<boolean>(false);
  const prevEditorValue = useRef<string>("");

  // ------------- side effects -------------
  // Update formik when editorValue changes (user typing)
  useEffect(() => {
    // Only update if the value actually changed and we're not in the middle of syncing from formik
    if (!isUpdatingFromFormik.current && editorValue !== prevEditorValue.current) {
      if (formik && formik.values && formik.values[id] !== editorValue) {
        formik.setFieldValue(id, editorValue, false); // false = don't validate
      }
      prevEditorValue.current = editorValue;
    }
  }, [editorValue, id]);

  // Initialize from initialValue prop
  useEffect(() => {
    if (initialValue && initialValue !== editorValue) {
      setEditorValue(initialValue);
      prevEditorValue.current = initialValue;
    }
  }, [initialValue]);

  // Sync with formik.values when formik values change (for loading data from API)
  // This should only run when formik values are set externally (like from API)
  const prevFormikValue = useRef<string>("");
  useEffect(() => {
    const currentValue = formik?.values?.[id] || "";
    // Only sync if formik value changed externally (not from our own update)
    if (currentValue !== prevFormikValue.current && currentValue !== editorValue) {
      isUpdatingFromFormik.current = true;
      setEditorValue(currentValue);
      prevEditorValue.current = currentValue;
      prevFormikValue.current = currentValue;
      // Reset flag after a brief delay to allow the state update to complete
      setTimeout(() => {
        isUpdatingFromFormik.current = false;
      }, 0);
    } else {
      prevFormikValue.current = currentValue;
    }
  }, [formik?.values?.[id], id]);

  return (
    <>
      <ReactQuill
        theme="snow"
        id={id}
        value={editorValue}
        onChange={setEditorValue}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height: height }}
      />
    </>
  );
};

export default TextEditor;
