const isEnabled = (value: unknown) => {
  if (value === false) return false;
  return String(value ?? "true").toLowerCase() !== "false";
};

const COOKIE_CONSENT_KEY = "cookieConsent";
const COOKIE_CONSENT_EVENT = "cookie-consent-updated";
const ANALYTICS_SCRIPT_SELECTOR = "script[data-aipan-analytics]";
const GA_MEASUREMENT_ID = "G-17SPF6S871";

const hasAnalyticsConsent = () => {
  const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (consent === "accepted") return true;
  if (!consent || consent === "necessary") return false;

  try {
    return JSON.parse(consent)?.analytics === true;
  } catch {
    return false;
  }
};

const loadAnalytics = () => {
  if (!hasAnalyticsConsent() || document.querySelector(ANALYTICS_SCRIPT_SELECTOR)) {
    return;
  }

  const analyticsWindow = window as typeof window & {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  };

  analyticsWindow.dataLayer ||= [];
  analyticsWindow.gtag ||= (...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args);
  };
  analyticsWindow.gtag("js", new Date());
  analyticsWindow.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  script.dataset.aipanAnalytics = "true";
  document.head.append(script);
};

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  if (!isEnabled(config.public.enableThirdPartyScripts)) {
    return;
  }

  onNuxtReady(loadAnalytics);
  window.addEventListener(COOKIE_CONSENT_EVENT, loadAnalytics);
});
