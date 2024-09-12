import prisma from "~/lib/prisma";
import GithubSlugger from 'github-slugger'

export default defineEventHandler(async (event) => {
    const { title, content, categoryIds } = await readBody(event)

    const userId = event.context.user.userId;
    if (!title || !content || !userId || !categoryIds) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Title, content, creatorId, and categoryIds are required'
        })
    }
    try {
        const slugger = new GithubSlugger()

        let initSlug = slugger.slug(title)

        let existingPost = await prisma.post.findUnique({
            where: {
                slug: initSlug
            }
        })
        if (existingPost) {
            initSlug = `${initSlug}-${Date.now()}`
        }
        const newPost = await prisma.post.create({
            data: {
                title,
                slug: initSlug,
                content,
                creatorId: userId,
                categories: {
                    create: categoryIds.map((id: number) => ({
                        category: { connect: { id } }
                    }))
                }
            }
        })
        let finalSlug = slugger.slug(`${title}-${newPost.id}-${Date.now()}`)
        const updatePost = await prisma.post.update({
            where: { id: newPost.id },
            data: {
                slug: finalSlug
            }
        })
        return {
            code: 200,
            msg: 'success',
            data: updatePost
        }

    } catch (error) {
        return error
    }


})