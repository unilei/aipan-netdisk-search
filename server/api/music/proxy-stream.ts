export default defineEventHandler(async (event) => {
    try {
        // 获取URL参数
        const query = await getQuery(event);
        const url = query.url as string;

        if (!url) {
            return {
                code: 400,
                msg: 'Missing URL parameter',
            };
        }

        // 安全检查：只代理允许的域名
        const allowedDomains = [
            'cdnt-preview.dzcdn.net',
            'cdn-preview-',   // Deezer preview CDN variants
            'dzcdn.net',
        ];
        const urlObj = new URL(url);
        const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
        if (!isAllowed) {
            return {
                code: 403,
                msg: 'Domain not allowed',
            };
        }

        // 获取Response对象
        const response = await fetch(url);

        // 如果响应不成功，返回错误
        if (!response.ok) {
            return {
                code: response.status,
                msg: `Failed to fetch audio: ${response.statusText}`,
            };
        }

        // 获取内容类型
        const contentType = response.headers.get('content-type') || 'audio/mpeg';
        const contentLengthStr = response.headers.get('content-length');

        // 设置响应头部
        setResponseHeaders(event, {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
        });

        if (contentLengthStr) {
            // 将字符串转换为数字
            const contentLength = parseInt(contentLengthStr, 10);
            if (!isNaN(contentLength)) {
                setResponseHeader(event, 'Content-Length', contentLength);
            }
        }

        // 将原始响应直接转发给客户端
        return response.body;

    } catch (error) {
        console.error('Proxy stream error:', error);
        return {
            code: 500,
            msg: 'Server error while proxying audio stream',
        };
    }
});
