import { verifyToken } from '~/server/model/user'
import { autoReviewPendingUserResources } from "~/server/services/userResources/autoReviewRunner.js";

const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
    const parsed = Number.parseInt(String(value || ''), 10)
    if (!Number.isFinite(parsed)) {
        return fallback
    }

    return Math.min(Math.max(parsed, min), max)
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
    const limit = clampInt(body?.limit, 20, 1, 100)

    const data = await autoReviewPendingUserResources({
        dryRun,
        approveValid: body?.approveValid !== false,
        rejectInvalid: Boolean(body?.rejectInvalid),
        requireReachable: body?.requireReachable !== false,
        notifyUser: !dryRun && body?.notifyUser !== false,
        emailEnabled: body?.emailEnabled !== false,
        limit
    })

    return {
        code: 200,
        msg: dryRun ? '自动审核预检查完成' : '自动审核执行完成',
        data
    }
})
