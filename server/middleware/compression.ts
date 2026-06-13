import { constants, createGzip, type Gzip } from 'node:zlib';
import { defineEventHandler } from 'h3';

const COMPRESSIBLE_CONTENT_TYPES = [
  'text/html',
  'text/css',
  'text/plain',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'image/svg+xml',
];

function acceptsGzip(value: string | string[] | undefined) {
  const encodings = String(Array.isArray(value) ? value.join(',') : value || '')
    .split(',')
    .map((entry) => {
      const [name = '', ...parameters] = entry
        .trim()
        .toLowerCase()
        .split(';')
        .map((part) => part.trim());
      const qualityParameter = parameters.find((parameter) => parameter.startsWith('q='));
      const quality = qualityParameter
        ? Number.parseFloat(qualityParameter.slice(2))
        : 1;

      return {
        name,
        quality: Number.isFinite(quality) ? quality : 0,
      };
    });

  const gzip = encodings.find((encoding) => encoding.name === 'gzip');
  if (gzip) {
    return gzip.quality > 0;
  }

  return Boolean(encodings.find((encoding) => encoding.name === '*' && encoding.quality > 0));
}

function isCompressible(contentType: unknown) {
  const normalized = String(contentType || '').toLowerCase();
  return COMPRESSIBLE_CONTENT_TYPES.some((type) => normalized.includes(type));
}

function appendVaryAcceptEncoding(current: unknown) {
  if (!current) {
    return 'Accept-Encoding';
  }

  const value = Array.isArray(current) ? current.join(', ') : String(current);

  if (value.toLowerCase().includes('accept-encoding')) {
    return value;
  }

  return `${value}, Accept-Encoding`;
}

function toBuffer(chunk: any, encoding?: BufferEncoding) {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }

  return Buffer.from(chunk, encoding);
}

type WriteCallback = (error: Error | null | undefined) => void;
type EndCallback = () => void;

export default defineEventHandler((event) => {
  const { req, res } = event.node;

  if (req.method === 'HEAD' || !acceptsGzip(req.headers['accept-encoding'])) {
    return;
  }

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  let gzip: Gzip | null = null;
  let decided = false;
  let shouldCompress = false;
  let ending = false;

  const startCompressionIfNeeded = () => {
    if (decided) {
      return;
    }

    decided = true;

    shouldCompress =
      res.statusCode !== 204 &&
      res.statusCode !== 304 &&
      !res.getHeader('Content-Encoding') &&
      isCompressible(res.getHeader('Content-Type'));

    if (!shouldCompress) {
      return;
    }

    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', appendVaryAcceptEncoding(res.getHeader('Vary')));
    res.removeHeader('Content-Length');
    res.removeHeader('ETag');

    gzip = createGzip({ flush: constants.Z_SYNC_FLUSH });
    gzip.on('data', (chunk: Buffer) => {
      originalWrite(chunk);
    });
    gzip.on('error', (error) => {
      res.destroy(error);
    });
  };

  res.write = ((chunk: any, encoding?: BufferEncoding | WriteCallback, callback?: WriteCallback) => {
    startCompressionIfNeeded();

    const done = typeof encoding === 'function' ? encoding : callback;

    if (!shouldCompress || !gzip) {
      if (typeof encoding === 'string') {
        return originalWrite(chunk, encoding, done);
      }

      return originalWrite(chunk, done);
    }

    return gzip.write(toBuffer(chunk, typeof encoding === 'string' ? encoding : undefined), done);
  }) as typeof res.write;

  res.end = ((chunk?: any, encoding?: BufferEncoding | EndCallback, callback?: EndCallback) => {
    startCompressionIfNeeded();

    const done = typeof encoding === 'function' ? encoding : callback;

    if (!shouldCompress || !gzip) {
      if (typeof encoding === 'string') {
        return originalEnd(chunk, encoding, done);
      }

      return originalEnd(chunk, done);
    }

    if (ending) {
      return false;
    }

    ending = true;

    gzip.once('end', () => {
      originalEnd(done);
    });

    gzip.end(chunk ? toBuffer(chunk, typeof encoding === 'string' ? encoding : undefined) : undefined);

    return res;
  }) as typeof res.end;
});
