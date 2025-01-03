import { writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user;
        if (!user) {
            throw createError({
                statusCode: 401,
                message: "请先登录"
            });
        }

        // 获取上传的文件
        const formData = await readMultipartFormData(event)
        if (!formData || formData.length === 0) {
            throw createError({
                statusCode: 400,
                message: "未找到上传的文件"
            })
        }

        const file = formData[0]
        if (!file.filename) {
            throw createError({
                statusCode: 400,
                message: "文件名不能为空"
            })
        }

        // 生成唯一的文件名
        const ext = file.filename.split('.').pop()
        const fileName = `${randomUUID()}.${ext}`

        // 确保上传目录存在
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        await ensureDir(uploadDir)

        // 写入文件
        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, file.data)

        // 获取文件信息
        const fileInfo = {
            url: `/uploads/${fileName}`,
            size: file.data.length,
            format: ext
        }

        return {
            code: 200,
            msg: "上传成功",
            data: fileInfo
        }
    } catch (error: any) {
        console.error('文件上传失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "文件上传失败"
        })
    }
})

// 确保目录存在
async function ensureDir(dir: string) {
    try {
        await readdir(dir)
    } catch {
        await mkdir(dir, { recursive: true })
    }
} 