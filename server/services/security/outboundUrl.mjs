import { lookup as nodeLookup, promises as dns } from "node:dns";
import { BlockList, isIP } from "node:net";

const blockedAddresses = new BlockList();

[
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
].forEach(([network, prefix]) => {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
});

[
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001::", 32],
  ["2001:2::", 48],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
].forEach(([network, prefix]) => {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
});

const normalizeHostname = (hostname) =>
  String(hostname || "")
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();

const extractMappedIpv4Address = (address) => {
  const dotted = address.match(
    /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i,
  );
  if (dotted) {
    return dotted[1];
  }

  const hexadecimal = address.match(
    /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i,
  );
  if (!hexadecimal) {
    return null;
  }

  const high = Number.parseInt(hexadecimal[1], 16);
  const low = Number.parseInt(hexadecimal[2], 16);
  return [
    high >> 8,
    high & 0xff,
    low >> 8,
    low & 0xff,
  ].join(".");
};

export const isBlockedIpAddress = (address) => {
  const normalized = normalizeHostname(address).split("%")[0];
  const mappedIpv4 = extractMappedIpv4Address(normalized);
  if (mappedIpv4) {
    return isBlockedIpAddress(mappedIpv4);
  }
  const family = isIP(normalized);

  if (family === 4) {
    return blockedAddresses.check(normalized, "ipv4");
  }

  if (family === 6) {
    return blockedAddresses.check(normalized, "ipv6");
  }

  return true;
};

export const assertSafeRemoteUrlShape = (value) => {
  const rawValue = value instanceof URL ? value.toString() : value;
  if (typeof rawValue !== "string" || !rawValue || rawValue.length > 2048) {
    throw new Error("Invalid remote URL");
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error("Invalid remote URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Remote URL protocol is not allowed");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Remote URL credentials are not allowed");
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Remote URL hostname is not allowed");
  }

  if (isIP(hostname) && isBlockedIpAddress(hostname)) {
    throw new Error("Remote URL resolves to a blocked address");
  }

  return parsed;
};

export const assertSafeRemoteUrl = async (
  value,
  { lookup = dns.lookup } = {},
) => {
  const parsed = assertSafeRemoteUrlShape(value);
  const hostname = normalizeHostname(parsed.hostname);

  if (isIP(hostname)) {
    return parsed;
  }

  const addresses = await lookup(hostname, {
    all: true,
    verbatim: true,
  });
  const normalizedAddresses = Array.isArray(addresses) ? addresses : [addresses];

  if (
    normalizedAddresses.length === 0 ||
    normalizedAddresses.some(({ address }) => isBlockedIpAddress(address))
  ) {
    throw new Error("Remote URL resolves to a blocked address");
  }

  return parsed;
};

/**
 * Node's HTTP agent uses this resolver for the actual connection, preventing a
 * second DNS answer from bypassing the preflight address check.
 */
export const safeDnsLookup = (hostname, options, callback) => {
  const normalizedOptions =
    typeof options === "number"
      ? { family: options }
      : { ...(options || {}) };

  nodeLookup(
    normalizeHostname(hostname),
    {
      ...normalizedOptions,
      all: true,
      verbatim: true,
    },
    (error, addresses) => {
      if (error) {
        callback(error);
        return;
      }

      const resolvedAddresses = Array.isArray(addresses)
        ? addresses
        : [addresses];
      if (
        resolvedAddresses.length === 0 ||
        resolvedAddresses.some(({ address }) => isBlockedIpAddress(address))
      ) {
        callback(new Error("Remote URL resolves to a blocked address"));
        return;
      }

      if (normalizedOptions.all) {
        callback(null, resolvedAddresses);
        return;
      }

      const firstAddress = resolvedAddresses[0];
      callback(null, firstAddress.address, firstAddress.family);
    },
  );
};

export const assertSafeRedirectOptions = (options = {}) => {
  const protocol = String(options.protocol || "");
  const hostname = normalizeHostname(options.hostname || options.host);
  const formattedHostname = hostname.includes(":")
    ? `[${hostname}]`
    : hostname;
  const port = options.port ? `:${options.port}` : "";

  return assertSafeRemoteUrlShape(
    `${protocol}//${formattedHostname}${port}/`,
  );
};

export const isAllowedDeezerPreviewHost = (hostname) => {
  const normalized = normalizeHostname(hostname);

  if (normalized === "cdnt-preview.dzcdn.net") {
    return true;
  }

  return /^(?:cdn|cdns|cdnt)-preview-[a-z0-9-]+\.dzcdn\.net$/i.test(
    normalized,
  );
};
