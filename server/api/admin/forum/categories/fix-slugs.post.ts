import prisma from "~/lib/prisma"
import slugify from 'slugify'

export default defineEventHandler(async (event) => {
    try {
        // 检查管理员权限
        const user = event.context.user
        if (!user || user.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        // 获取所有分类
        const categories = await prisma.forumCategory.findMany()

        const results = []

        // 逐个更新分类的slug
        for (const category of categories) {
            // 检查现有slug是否有效
            let needsUpdate = false;
            let slug = category.slug;

            // 如果slug为空或格式不正确，才需要生成新slug
            if (!slug || !slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
                needsUpdate = true;
                // 方法1: 根据ID生成简单slug
                slug = `category-${category.id}`;
            }

            // 检查slug是否已存在（除了当前分类）
            if (needsUpdate) {
                const slugExists = await prisma.forumCategory.findFirst({
                    where: {
                        slug,
                        id: { not: category.id }
                    }
                });

                // 如果slug已存在，添加随机后缀
                if (slugExists) {
                    slug = `${slug}-${Date.now().toString().slice(-6)}`;
                }

                // 更新分类
                const updated = await prisma.forumCategory.update({
                    where: { id: category.id },
                    data: { slug }
                });

                results.push({
                    id: category.id,
                    name: category.name,
                    oldSlug: category.slug,
                    newSlug: updated.slug
                });
            }
        }

        return {
            success: true,
            message: `已修复 ${results.length} 个分类的URL标识`,
            data: results
        }
    } catch (error: any) {
        console.error('修复分类URL标识失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '修复分类URL标识失败'
        }
    }
}) 