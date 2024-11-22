interface GithubConfig {
    owner: string
    repo: string
    token: string
    branch: string
    cdnPrefix: string
}

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
                resolve(e.target.result.toString().split(',')[1])
            } else {
                reject(new Error('Failed to convert file to Base64'))
            }
        }
        reader.onerror = (error) => reject(error)
        reader.readAsDataURL(file)
    })
}

// 上传单个文件到 GitHub
const uploadSingleFile = async (file: File, config: GithubConfig): Promise<UploadResult> => {
    try {
        const fileName = generateUniqueFileName(file)
        const base64 = await fileToBase64(file)
        
        await $fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/images/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json',
            },
            body: {
                message: `Upload image: ${fileName}`,
                content: base64,
                branch: config.branch
            }
        })

        // 修改 CDN URL 的格式
        const cdnUrl = `${config.cdnPrefix}/${config.owner}/${config.repo}@${config.branch}/images/${fileName}`
        return { url: cdnUrl }
    } catch (error) {
        console.error('Single file upload failed:', error)
        return { 
            url: null, 
            error: `图片 ${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
    }
}

// 批量上传图片
export const uploadImages = async (
    files: File[], 
    config: {
        owner: string;
        repo: string;
        token: string;
        branch?: string;
    }
): Promise<{ urls: string[]; errors: string[] }> => {
    const githubConfig: GithubConfig = {
        owner: config.owner,
        repo: config.repo,
        token: config.token,
        branch: config.branch || 'main',
        cdnPrefix: 'https://cdn.jsdelivr.net/gh'
    }

    try {
        // 验证 GitHub 配置
        if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
            return {
                urls: [],
                errors: ['GitHub 配置不完整，请检查配置参数']
            }
        }

        const results: UploadResult[] = []
        const errors: string[] = []

        // 验证并上传文件
        for (const file of files) {
            const validation = validateFile(file)
            if (!validation.valid) {
                errors.push(`${file.name}: ${validation.error}`)
                continue
            }

            const result = await uploadSingleFile(file, githubConfig)
            if (result.url) {
                results.push(result)
            }
            if (result.error) {
                errors.push(result.error)
            }
        }

        return {
            urls: results.map(r => r.url).filter((url): url is string => url !== null),
            errors
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
    file: File,
    config: {
        owner: string;
        repo: string;
        token: string;
        branch?: string;
    }
): Promise<{ url: string | null; error?: string }> => {
    const result = await uploadImages([file], config)
    return {
        url: result.urls[0] || null,
        error: result.errors[0]
    }
}
