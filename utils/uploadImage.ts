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

// 将文件转换为 Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result) {
                const result = e.target.result.toString().split(',')[1]
                if (result) {
                    resolve(result)
                } else {
                    reject(new Error('Failed to extract Base64 data'))
                }
            } else {
                reject(new Error('Failed to convert file to Base64'))
            }
        }
        reader.onerror = (error) => reject(error)
        reader.readAsDataURL(file)
    })
}

// 批量上传图片（通过服务端代理）
export const uploadImages = async (
    files: File[]
): Promise<{ urls: string[]; errors: string[] }> => {
    try {
        const errors: string[] = []
        const validFiles: { fileName: string; base64: string }[] = []

        // 验证并准备文件数据
        for (const file of files) {
            const validation = validateFile(file)
            if (!validation.valid) {
                errors.push(`${file.name}: ${validation.error}`)
                continue
            }

            try {
                const base64 = await fileToBase64(file)
                const fileName = generateUniqueFileName(file)
                validFiles.push({ fileName, base64 })
            } catch (error) {
                errors.push(`${file.name}: 文件读取失败`)
            }
        }

        if (validFiles.length === 0) {
            return { urls: [], errors }
        }

        // 调用服务端上传接口
        const result: { code: number; urls: string[]; errors: string[] } = await ($fetch as Function)('/api/upload/image', {
            method: 'POST',
            body: {
                files: validFiles
            }
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
