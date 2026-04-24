import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";
import { syncPublishedUserResource } from "~/server/services/search/elasticsearchClient.js";
import {
    buildUserResourceAuditContext,
    evaluateUserResourceForAutoReview,
} from "~/server/services/userResources/autoReview.js";

const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
    const parsed = Number.parseInt(String(value || ''), 10)
    if (!Number.isFinite(parsed)) {
        return fallback
    }

    return Math.min(Math.max(parsed, min), max)
}

const includeUserResourceRelations = {
    creator: {
        select: {
            id: true,
            username: true,
            email: true
        }
    },
    type: true
}

export default defineEventHandler(async (event) => {
    const token = getHeader(event, 'authorization')?.split(' ')[1]
    const user = token ? verifyToken(token) : null

    if (!user || user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            message: '无权限访问'
        })
    }

    const body = await readBody(event)
    const dryRun = body?.dryRun !== false
    const approveValid = body?.approveValid !== false
    const rejectInvalid = Boolean(body?.rejectInvalid)
    const requireReachable = body?.requireReachable !== false
    const limit = clampInt(body?.limit, 20, 1, 100)

    const [pendingResources, storedResources, publishedUserResources, allPendingResources] = await Promise.all([
        prisma.userResource.findMany({
            where: { status: 'pending' },
            include: includeUserResourceRelations,
            orderBy: { createdAt: 'asc' },
            take: limit
        }),
        prisma.resource.findMany({
            select: {
                id: true,
                name: true,
                links: true
            }
        }),
        prisma.userResource.findMany({
            where: { status: 'published' },
            select: {
                id: true,
                name: true,
                links: true
            }
        }),
        prisma.userResource.findMany({
            where: { status: 'pending' },
            select: {
                id: true,
                name: true,
                links: true
            }
        })
    ])

    const context = buildUserResourceAuditContext({
        storedResources,
        publishedUserResources,
        pendingUserResources: allPendingResources
    })

    const results = []
    let approved = 0
    let rejected = 0
    let skipped = 0
    let failed = 0

    for (const resource of pendingResources) {
        const review = await evaluateUserResourceForAutoReview(resource, context, {
            requireReachable
        })

        const result: any = {
            ...review,
            action: 'skip'
        }

        if (dryRun) {
            result.action = review.canAutoApprove
                ? 'would_approve'
                : review.shouldReject && rejectInvalid
                    ? 'would_reject'
                    : 'would_skip'
            results.push(result)
            if (result.action === 'would_approve') {
                approved += 1
            } else if (result.action === 'would_reject') {
                rejected += 1
            } else {
                skipped += 1
            }
            continue
        }

        try {
            if (review.canAutoApprove && approveValid) {
                const updatedResource = await prisma.userResource.update({
                    where: { id: resource.id },
                    data: { status: 'published' },
                    include: includeUserResourceRelations
                })

                try {
                    await syncPublishedUserResource(updatedResource)
                } catch (syncError) {
                    await prisma.userResource.update({
                        where: { id: resource.id },
                        data: { status: 'pending' }
                    })
                    throw syncError
                }

                result.action = 'approved'
                approved += 1
            } else if (review.shouldReject && rejectInvalid) {
                await prisma.userResource.update({
                    where: { id: resource.id },
                    data: { status: 'rejected' }
                })
                result.action = 'rejected'
                rejected += 1
            } else {
                result.action = 'skipped'
                skipped += 1
            }
        } catch (error: any) {
            console.error('自动审核用户资源失败:', {
                resourceId: resource.id,
                error
            })
            result.action = 'failed'
            result.error = error?.message || '自动审核失败'
            failed += 1
        }

        results.push(result)
    }

    return {
        code: 200,
        msg: dryRun ? '自动审核预检查完成' : '自动审核执行完成',
        data: {
            dryRun,
            options: {
                limit,
                approveValid,
                rejectInvalid,
                requireReachable
            },
            checked: pendingResources.length,
            approved,
            rejected,
            skipped,
            failed,
            results
        }
    }
})
