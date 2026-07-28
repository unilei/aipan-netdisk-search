import DOMPurify from "isomorphic-dompurify";

const SANITIZE_OPTIONS = Object.freeze({
  USE_PROFILES: {
    html: true,
  },
  SANITIZE_NAMED_PROPS: true,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "option"],
  FORBID_ATTR: ["style"],
});

/**
 * Sanitize rich text with the same policy during SSR and in the browser.
 * Returning unsanitized HTML on the server would expose the initial document
 * before Vue has a chance to hydrate it.
 */
export const sanitizeHtmlContent = (dirty) => {
  if (typeof dirty !== "string" || !dirty) {
    return "";
  }

  return String(DOMPurify.sanitize(dirty, SANITIZE_OPTIONS));
};
