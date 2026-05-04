import prisma from "~/lib/prisma"

// 定义回复类型接口
interface PostWithChildren extends Omit<any, 'children'> {
    id: string;
    parentId: string | null;
    children: PostWithChildren[];
    [key: string]: any;
}

export default defineEventHandler(async (event) => {
    try {
        const { slug } = getRouterParams(event)

        if (!slug) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 获取主题详情，只返回已批准的主题
        const topic = await prisma.forumTopic.findFirst({
            where: {
                slug: decodeURI(slug),
                status: 'approved' // 只返回已批准的主题
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarStyle: true,
                        createdAt: true,
                    }
                },
                category: true,
            }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 获取帖子回复
        const query = getQuery(event)
        const page = query.page ? parseInt(query.page as string) : 1
        const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20

        const total = await prisma.forumPost.count({
            where: {
                topicId: topic.id,
                status: 'approved' // 只统计已批准的回复
            }
        })

        // 获取所有回复，包括父子关系
        const posts = await prisma.forumPost.findMany({
            where: {
                topicId: topic.id,
                status: 'approved' // 只查询已批准的回复
            },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarStyle: true,
                        createdAt: true,
                    }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        // 构建回复树结构
        const rootPosts: PostWithChildren[] = []
        const replyMap = new Map<string, PostWithChildren>()
        
        // 首先将所有回复放入映射表中
        posts.forEach((post: any) => {
            // 确保回复有子回复数组
            const postWithChildren = post as PostWithChildren
            postWithChildren.children = []
            replyMap.set(post.id, postWithChildren)
        })
        
        // 然后构建树结构
        posts.forEach((post: any) => {
            if (post.parentId) {
                // 如果有父回复，将当前回复添加到父回复的子回复数组中
                const parentPost = replyMap.get(post.parentId)
                if (parentPost) {
                    parentPost.children.push(replyMap.get(post.id) as PostWithChildren)
                } else {
                    // 如果找不到父回复（可能是分页问题），则作为根回复处理
                    rootPosts.push(replyMap.get(post.id) as PostWithChildren)
                }
            } else {
                // 如果没有父回复，则是根回复
                rootPosts.push(replyMap.get(post.id) as PostWithChildren)
            }
        })

        // 更新浏览次数
        await prisma.forumTopic.update({
            where: { id: topic.id },
            data: { viewCount: { increment: 1 } }
        })

        return {
            success: true,
            data: {
                topic,
                posts: rootPosts,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error) {
        console.error('获取主题详情失败:', error)
        return {
            success: false,
            message: '获取主题详情失败'
        }
    }
}) 