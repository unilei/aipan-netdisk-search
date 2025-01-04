import prisma from "~/lib/prisma";
import GithubSlugger from 'github-slugger'

export default defineEventHandler(async (event) => {
    const { title, content, categoryIds, tags } = await readBody(event)

    const userId = event.context.user.userId;
    if (!title || !content || !userId || !categoryIds || !tags) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Title, content, authorId, categoryIds, and tags are required'
        })
    }
    try {
        const slugger = new GithubSlugger()

        let initSlug = slugger.slug(title)

        let existingPost = await prisma.blogPost.findUnique({
            where: {
                slug: initSlug
            }
        })
        if (existingPost) {
            initSlug = `${initSlug}-${Date.now()}`
        }
        const newPost = await prisma.blogPost.create({
            data: {
                title,
                slug: initSlug,
                content,
                tags,
                author: {
                    connect: { id: userId }
                },
                categories: {
                    create: categoryIds.map((id: number) => ({
                        category: { connect: { id } }
                    }))
                }
            }
        })
        let finalSlug = slugger.slug(`${title}-${newPost.id}-${Date.now()}`)
        const updatePost = await prisma.blogPost.update({
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