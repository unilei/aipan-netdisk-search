import DOMPurify from 'dompurify'

/**
 * 使用 DOMPurify 对 HTML 内容进行 XSS 清理
 */
export const sanitizeHtml = (dirty: string): string => {
    if (!dirty) return ''
    return DOMPurify.sanitize(dirty)
}
