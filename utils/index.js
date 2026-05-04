export const parseM3U = (m3u) => {
  const lines = m3u.split("\n").filter((line) => line.trim() !== "");
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const metadata = lines[i];
      const url = lines[i + 1];

      const nameMatch = metadata.match(/tvg-name="(.*?)"/);
      const logoMatch = metadata.match(/tvg-logo="(.*?)"/);
      const groupMatch = metadata.match(/group-title="(.*?)"/);

      result.push({
        name: nameMatch ? nameMatch[1] : null,
        logo: logoMatch ? logoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : null,
        url: url.trim(),
      });
    }
  }

  return result;
};

// Simple browser-compatible encoding/decoding
const SALT = "aipan_music_2024";

export function simpleEncode(text) {
  const combined = text + SALT;
  return btoa(encodeURIComponent(combined));
}

export const simpleDecode = (encoded) => {
  try {
    const decoded = decodeURIComponent(atob(encoded));
    if (decoded.endsWith(SALT)) {
      return decoded.slice(0, -SALT.length);
    }
    return null;
  } catch (err) {
    return null;
  }
};
