interface UploadResult {
    url: string | null
    error?: string
}

// 生成唯一的文件名
const generateUniqueFileName = (file: File): string => {
    const ext = file.name.split('.').pop()
    const timestamp = new Date().getTime()
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}.${ext}`
}

// 验证文件
const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: '只支持 JPG、PNG、GIF、WEBP 格式的图片'
        }
    }

    // 检查文件大小（限制为 5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
        return {
            valid: false,
            error: '图片大小不能超过 5MB'
        }
    }

    return { valid: true }
}

// 批量上传图片（通过服务端代理）
export const uploadImages = async (
    files: File[]
): Promise<{ urls: string[]; errors: string[] }> => {
    try {
        const errors: string[] = []
        const formData = new FormData()

        for (const file of files) {
            const validation = validateFile(file)
            if (!validation.valid) {
                errors.push(`${file.name}: ${validation.error}`)
                continue
            }

            const uploadFile = new File([file], generateUniqueFileName(file), {
                type: file.type
            })
            formData.append('files', uploadFile)
        }

        if (!formData.has('files')) {
            return { urls: [], errors }
        }

        const token = useCookie('token').value
        const headers = token ? { authorization: `Bearer ${token}` } : undefined

        const result: { code: number; urls: string[]; errors: string[] } = await ($fetch as Function)('/api/upload/image', {
            method: 'POST',
            body: formData,
            headers
        })

        return {
            urls: result.urls || [],
            errors: [...errors, ...(result.errors || [])]
        }
    } catch (error) {
        console.error('Upload failed:', error)
        return {
            urls: [],
            errors: [`上传失败: ${error instanceof Error ? error.message : '未知错误'}`]
        }
    }
}

// 单个图片上传（用于表单上传等场景）
export const uploadSingleImage = async (
    file: File
): Promise<{ url: string | null; error?: string }> => {
    const result = await uploadImages([file])
    return {
        url: result.urls[0] || null,
        error: result.errors[0]
    }
}
