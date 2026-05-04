import { releaseNotes as staticReleaseNotes } from "../../../utils/releaseNotes.js";

export const RELEASE_NOTES_SETTING_KEY = "product_releases";
export const RELEASE_NOTES_SETTING_GROUP = "releases";

const DEFAULT_CATEGORY = "网站更新";
const PUBLISHED_STATUS = "published";

const toBoolean = (value) => value === true || value === "true";

const todayString = () => new Date().toISOString().slice(0, 10);

const normalizeDate = (value) => {
  if (!value) return todayString();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return todayString();
  return date.toISOString().slice(0, 10);
};

export const normalizeHighlights = (highlights) => {
  if (Array.isArray(highlights)) {
    return highlights
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof highlights === "string") {
    return highlights
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeReleaseNote = (note = {}) => {
  const date = normalizeDate(note.date || note.publishedAt);
  const version = String(note.version || date).trim();
  const title = String(note.title || "").trim();
  const summary = String(note.summary || "").trim();
  const status = String(note.status || PUBLISHED_STATUS).trim() || PUBLISHED_STATUS;
  const createdAt = note.createdAt || new Date().toISOString();

  return {
    version,
    date,
    title,
    summary,
    category: String(note.category || DEFAULT_CATEGORY).trim() || DEFAULT_CATEGORY,
    highlights: normalizeHighlights(note.highlights),
    status,
    isImportant: toBoolean(note.isImportant),
    isPinned: toBoolean(note.isPinned),
    createdAt,
    updatedAt: note.updatedAt || createdAt,
  };
};

export const sortReleaseNotes = (notes) =>
  [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const byDate = String(b.date).localeCompare(String(a.date));
    if (byDate !== 0) return byDate;
    return String(b.version).localeCompare(String(a.version));
  });

export const normalizeReleaseNotes = (notes = [], options = {}) => {
  const includeDrafts = options.includeDrafts === true;
  const seen = new Set();
  const normalized = [];

  for (const rawNote of Array.isArray(notes) ? notes : []) {
    const note = normalizeReleaseNote(rawNote);
    if (!note.version || !note.title || !note.summary) continue;
    if (!includeDrafts && note.status !== PUBLISHED_STATUS) continue;
    if (seen.has(note.version)) continue;
    seen.add(note.version);
    normalized.push(note);
  }

  return sortReleaseNotes(normalized);
};

export const parseReleaseNotesSetting = (value) => {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.notes)) return parsed.notes;
  } catch (error) {
    console.error("解析发布日志配置失败:", error);
  }

  return [];
};

export const serializeReleaseNotesSetting = (notes) =>
  JSON.stringify({
    notes: normalizeReleaseNotes(notes, { includeDrafts: true }),
    updatedAt: new Date().toISOString(),
  });

export const getStaticReleaseNotes = (options = {}) =>
  normalizeReleaseNotes(staticReleaseNotes, options);

export const getLatestReleaseIdentity = (note) => {
  if (!note) return "";
  return `${note.version}:${note.date}`;
};

export const getReleaseNotesFromSettings = async (prisma, options = {}) => {
  const includeDrafts = options.includeDrafts === true;
  const fallbackToStatic = options.fallbackToStatic !== false;

  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { key: RELEASE_NOTES_SETTING_KEY },
    });
    if (settings) {
      const storedNotes = parseReleaseNotesSetting(settings.value);
      return {
        notes: normalizeReleaseNotes(storedNotes, { includeDrafts }),
        source: "settings",
      };
    }
  } catch (error) {
    console.error("读取发布日志配置失败:", error);
    if (!fallbackToStatic) throw error;
  }

  if (!fallbackToStatic) {
    return {
      notes: [],
      source: "settings",
    };
  }

  return {
    notes: getStaticReleaseNotes({ includeDrafts }),
    source: "static",
  };
};

export const saveReleaseNotesToSettings = async (prisma, notes) => {
  const value = serializeReleaseNotesSetting(notes);

  return prisma.systemSettings.upsert({
    where: { key: RELEASE_NOTES_SETTING_KEY },
    update: {
      value,
      group: RELEASE_NOTES_SETTING_GROUP,
      description: "网站发布日志配置",
      isEnabled: true,
    },
    create: {
      key: RELEASE_NOTES_SETTING_KEY,
      value,
      group: RELEASE_NOTES_SETTING_GROUP,
      description: "网站发布日志配置",
      isEnabled: true,
    },
  });
};

export const upsertReleaseNote = (notes, payload, originalVersion = null) => {
  const nextNote = normalizeReleaseNote({
    ...payload,
    updatedAt: new Date().toISOString(),
    createdAt: payload.createdAt || new Date().toISOString(),
  });

  if (!nextNote.version || !nextNote.title || !nextNote.summary) {
    throw new Error("版本、标题和摘要不能为空");
  }

  const current = normalizeReleaseNotes(notes, { includeDrafts: true });
  const targetVersion = originalVersion || nextNote.version;
  const duplicate = current.find(
    (note) => note.version === nextNote.version && note.version !== targetVersion
  );

  if (duplicate) {
    throw new Error("版本号已存在");
  }

  const index = current.findIndex((note) => note.version === targetVersion);
  if (index >= 0) {
    nextNote.createdAt = current[index].createdAt || nextNote.createdAt;
    current.splice(index, 1, nextNote);
  } else {
    current.push(nextNote);
  }

  return normalizeReleaseNotes(current, { includeDrafts: true });
};

export const deleteReleaseNote = (notes, version) => {
  const current = normalizeReleaseNotes(notes, { includeDrafts: true });
  return current.filter((note) => note.version !== version);
};
