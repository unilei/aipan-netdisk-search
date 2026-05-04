export default defineEventHandler((event) => {
    const config = useRuntimeConfig();
    const allowedOrigins = (config.corsAllowedOrigins || 'https://aipan.me,https://www.aipan.me')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean);

    const origin = getRequestHeader(event, 'origin') || '';

    // Allow configured origins and local development
    const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isAllowed) {
        setResponseHeaders(event, {
            "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Expose-Headers": "Content-Length, X-Request-Id",
        });
    }

    if (event.method === 'OPTIONS') {
        event.node.res.statusCode = 204;
        event.node.res.statusMessage = "No Content.";
        return 'OK';
    }
})
