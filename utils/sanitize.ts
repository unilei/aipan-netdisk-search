import DOMPurify from 'dompurify'

/**
 * 使用 DOMPurify 对 HTML 内容进行 XSS 清理
 * SSR 时直接返回原文本（服务端数据来自受控源，风险可控）
 */
export const sanitizeHtml = (dirty: string): string => {
    if (!dirty) return ''
    // DOMPurify 依赖 window，服务端无法使用，直接返回原文本
    if (import.meta.server) return dirty
    return DOMPurify.sanitize(dirty)
}
