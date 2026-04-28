export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    try {
        const { files } = await readBody(event)

        if (!files || !Array.isArray(files) || files.length === 0) {
            return {
                code: 400,
                msg: '请提供要上传的文件',
                urls: [],
                errors: ['未提供文件']
            }
        }

        const owner = config.githubOwner
        const repo = config.githubRepo
        const token = config.githubToken
        const branch = config.githubBranch || 'main'
        const cdnPrefix = 'https://cdn.jsdelivr.net/gh'

        if (!token || !owner || !repo) {
            return {
                code: 500,
                msg: 'GitHub 配置不完整',
                urls: [],
                errors: ['GitHub 配置不完整，请检查服务端配置']
            }
        }

        const urls: string[] = []
        const errors: string[] = []

        for (const file of files) {
            try {
                const { fileName, base64 } = file

                if (!fileName || !base64) {
                    errors.push(`文件数据不完整`)
                    continue
                }

                await $fetch(`https://api.github.com/repos/${owner}/${repo}/contents/images/${fileName}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: {
                        message: `Upload image: ${fileName}`,
                        content: base64,
                        branch
                    }
                })

                const cdnUrl = `${cdnPrefix}/${owner}/${repo}@${branch}/images/${fileName}`
                urls.push(cdnUrl)
            } catch (error) {
                console.error('Single file upload failed:', error)
                errors.push(`图片 ${file.fileName} 上传失败`)
            }
        }

        return {
            code: 200,
            urls,
            errors
        }
    } catch (e) {
        console.error('Upload API error:', e)
        return {
            code: 500,
            msg: '服务器错误',
            urls: [],
            errors: ['上传服务异常']
        }
    }
})
