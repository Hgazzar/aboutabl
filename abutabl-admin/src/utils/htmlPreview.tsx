import React from "react";

const LOOKS_LIKE_HTML = /<[a-z][\s\S]*>/i;

type HtmlPreviewProps = {
  content: string;
  className?: string;
};

/**
 * Renders question/answer strings that may contain HTML from Quill.
 * Plain text is unchanged; HTML is injected so tags (e.g. &lt;p&gt;) are not shown as text.
 */
export function HtmlPreview({ content, className }: HtmlPreviewProps) {
  if (content == null || content === "") return null;
  if (!LOOKS_LIKE_HTML.test(content)) {
    return <span className={className}>{content}</span>;
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
