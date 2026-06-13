const isEnabled = (value: unknown) => {
  if (value === false) return false;
  return String(value ?? "true").toLowerCase() !== "false";
};

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  if (!isEnabled(config.public.enableThirdPartyScripts)) {
    return;
  }

  useHead({
    script: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-17SPF6S871",
        async: true,
      },
      {
        src: "/ga.js",
        defer: true,
      },
      {
        src: "/qrcode.min.js",
        defer: true,
      },
      {
        src: "https://challenges.cloudflare.com/turnstile/v0/api.js",
        async: true,
      },
      {
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8210373406341452",
        async: true,
        crossorigin: "anonymous",
      },
    ],
  });
});
