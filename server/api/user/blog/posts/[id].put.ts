import prisma from "~/lib/prisma";
import type { PrismaClient } from '@prisma/client';

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);

    const userId = event.context.user.userId;
    const { title, content, categoryIds, tags } = await readBody(event);
    if (!title || !content || !userId || !categoryIds || !tags) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Title, content, creatorId, categoryIds, and tags are required'
        })
    }

    const currentPost = await prisma.blogPost.findUnique({
        where: {
            id: Number(id),
        },
        include: {
            categories: {
                include: {
                    category: true
                }
            }
        }
    });

    if (!currentPost) {
        throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
    }
    if (currentPost.authorId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' }); // Only allow resource creators to update
    }

    try {
        // Use a transaction to ensure both operations (delete and update) succeed or fail together
        const result = await prisma.$transaction(async (tx: PrismaClient) => {
            // If the post was previously published (has an associated Post record), delete that record
            if (currentPost.status === 'published' && currentPost.postId) {
                await tx.post.delete({
                    where: { id: currentPost.postId }
                });
                console.log(`Deleted published Post with ID: ${currentPost.postId}`);
            }

            // Update the blog post, reset status to pending
            const updatedPost = await tx.blogPost.update({
                where: { id: Number(id) },
                data: {
                    title: title,
                    content: content,
                    tags: tags,
                    status: 'pending', // Force status to pending on edit
                    postId: null,      // Clear the associated Post ID
                    categories: {
                        deleteMany: {}, // Delete all existing associations
                        create: categoryIds.map((id: number) => ({
                            category: { connect: { id } }
                        }))
                    }
                },
                include: {
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            });

            return updatedPost;
        });

        return {
            code: 200,
            msg: 'success',
            data: result
        };
    } catch (error) {
        console.error('Failed to update blog post:', error);
        return { code: 500, error: 'Unable to update post', msg: String(error) }
    }
});