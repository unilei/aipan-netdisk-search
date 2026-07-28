import {
    assertSafeRemoteUrl,
    assertSafeRemoteUrlShape,
    isAllowedDeezerPreviewHost,
} from "~/server/services/security/outboundUrl.mjs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;

export default defineEventHandler(async (event) => {
    try {
        // 获取URL参数
        const query = await getQuery(event);
        const requestedUrl = Array.isArray(query.url) ? query.url[0] : query.url;

        if (typeof requestedUrl !== "string" || !requestedUrl) {
            return {
                code: 400,
                msg: 'Missing URL parameter',
            };
        }

        let url: URL;
        try {
            url = assertSafeRemoteUrlShape(requestedUrl);
        } catch {
            return {
                code: 403,
                msg: 'Domain not allowed',
            };
        }

        if (
            url.protocol !== "https:" ||
            !isAllowedDeezerPreviewHost(url.hostname)
        ) {
            return {
                code: 403,
                msg: 'Domain not allowed',
            };
        }

        try {
            await assertSafeRemoteUrl(url);
        } catch {
            return {
                code: 403,
                msg: 'Domain not allowed',
            };
        }

        // 获取Response对象
        const response = await fetch(url, {
            redirect: "error",
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });

        // 如果响应不成功，返回错误
        if (!response.ok) {
            return {
                code: response.status,
                msg: `Failed to fetch audio: ${response.statusText}`,
            };
        }

        // 获取内容类型
        const contentType = response.headers.get('content-type') || 'audio/mpeg';
        if (!contentType.toLowerCase().startsWith("audio/")) {
            return {
                code: 502,
                msg: 'Upstream response is not audio',
            };
        }

        const contentLengthStr = response.headers.get('content-length');
        const contentLength = contentLengthStr
            ? Number.parseInt(contentLengthStr, 10)
            : 0;

        if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES) {
            return {
                code: 413,
                msg: 'Audio preview is too large',
            };
        }

        if (!response.body) {
            return {
                code: 502,
                msg: 'Audio response body is empty',
            };
        }

        // 设置响应头部
        setResponseHeaders(event, {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
        });

        if (contentLength > 0) {
            setResponseHeader(event, 'Content-Length', contentLength);
        }

        let streamedBytes = 0;
        const limitedBody = response.body.pipeThrough(
            new TransformStream<Uint8Array, Uint8Array>({
                transform(chunk, controller) {
                    streamedBytes += chunk.byteLength;
                    if (streamedBytes > MAX_AUDIO_BYTES) {
                        controller.error(new Error("Audio preview is too large"));
                        return;
                    }

                    controller.enqueue(chunk);
                },
            }),
        );

        return limitedBody;

    } catch (error: any) {
        console.error('Proxy stream error:', error?.message || error);
        return {
            code: 500,
            msg: 'Server error while proxying audio stream',
        };
    }
});
