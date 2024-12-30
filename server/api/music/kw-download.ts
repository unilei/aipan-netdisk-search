type MusicResponse = {
    msg: string;
    url?: string;
};

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const { id, quality, filename } = query;

        if (!id) {
            return {
                msg: "error",
                error: "Missing id parameter",
            };
        }

        // 获取音乐URL
        const musicInfo = await $fetch<MusicResponse>('https://kwapi.aipan.me/api/music/url/music', {
            method: 'GET',
            query: {
                id,
                quality
            }
        });

        if (!musicInfo || !musicInfo.url || musicInfo.msg !== "success") {
            return {
                msg: "error",
                error: "Failed to get music URL",
            };
        }

        // 获取文件内容
        const response = await fetch(musicInfo.url);
        const arrayBuffer = await response.arrayBuffer();

        // 设置响应头，同时提供 ASCII 和 UTF-8 编码的文件名
        const asciiFilename = encodeURIComponent(filename as string).replace(/%./g, '_');
        setResponseHeaders(event, {
            "Content-Type": quality === "standard" || quality === "exhigh" ? "audio/mpeg" : "audio/flac",
            "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename as string)}`,
        });

        // 返回文件内容
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Download error:", error);
        return {
            msg: "error",
            error: "Download failed",
        };
    }
}); 