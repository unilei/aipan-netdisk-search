import {
    getTvboxDatabasePayload,
    syncTvboxSourcesToDatabase,
} from '~/server/services/tvbox/store.mjs'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const forceRefresh = query.refresh === '1' || query.refresh === 'true'

        if (forceRefresh) {
            const { meta } = await syncTvboxSourcesToDatabase({ fetcher: $fetch })
            const payload = await getTvboxDatabasePayload()

            return {
                msg: payload.list.length ? 'success' : 'No matches found',
                list: payload.list,
                meta: {
                    ...payload.meta,
                    sync: meta,
                },
            }
        }

        let payload = await getTvboxDatabasePayload()

        if (!payload.list.length) {
            const { meta } = await syncTvboxSourcesToDatabase({ fetcher: $fetch })
            payload = await getTvboxDatabasePayload()

            return {
                msg: payload.list.length ? 'success' : 'No matches found',
                list: payload.list,
                meta: {
                    ...payload.meta,
                    sync: meta,
                },
            }
        }

        return {
            msg: 'success',
            list: payload.list,
            meta: payload.meta,
        }
    } catch (e) {
        console.error('TVBox fetch error:', e)
        return { code: 500, msg: 'error', list: [] }
    }
})
