export const openUrlWithNoOpener = (url: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const newWindow = window.open("about:blank", "_blank");
  if (!newWindow) {
    return false;
  }

  newWindow.opener = null;
  newWindow.location.replace(url);
  return true;
};
