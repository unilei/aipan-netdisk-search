import prisma from "~/lib/prisma"
import GithubSlugger from 'github-slugger'

export default defineEventHandler(async (event) => {
    try {
        // 权限验证
        const user = event.context.user
        if (!user || user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        // 获取所有分类
        const categories = await prisma.forumCategory.findMany()

        // 使用一个对象来记录已经存在的slug，确保唯一性
        const existingSlugs = {}

        // 创建slugger实例
        const slugger = new GithubSlugger()

        // 修复结果
        const results = []

        // 遍历所有分类，修复slug
        for (const category of categories) {
            // 如果slug为空或者不合规，则生成新的slug
            let needsUpdate = false
            let newSlug = category.slug

            if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug)) {
                newSlug = slugger.slug(category.name)
                needsUpdate = true
            }

            // 确保slug唯一性
            if (existingSlugs[newSlug] && existingSlugs[newSlug] !== category.id) {
                // 如果slug已经存在，添加id作为后缀确保唯一
                newSlug = slugger.slug(`${category.name}-${category.id}`)
                needsUpdate = true
            }

            existingSlugs[newSlug] = category.id

            // 如果需要更新，则更新数据库
            if (needsUpdate) {
                await prisma.forumCategory.update({
                    where: { id: category.id },
                    data: { slug: newSlug }
                })

                results.push({
                    id: category.id,
                    name: category.name,
                    oldSlug: category.slug,
                    newSlug
                })
            }
        }

        return {
            success: true,
            message: `成功修复 ${results.length} 个分类的URL标识`,
            data: results
        }
    } catch (error) {
        console.error('修复分类URL标识失败:', error)
        return {
            success: false,
            message: '修复分类URL标识失败'
        }
    }
}) 