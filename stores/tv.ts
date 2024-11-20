import { defineStore } from "pinia";
export const useTvStore = defineStore('tv', {
    state() {
        return {
            tvCategory: 1,
            alistUrl: '',
            alistData: {},
            alistPath: [],
            alistSettingShow: false,
            alistPlayingShow: false,
            alistCurrentPlayIndex: 0
        }
    },
    actions: {
        setTvCategory(id: number) {
            this.tvCategory = id
        },
        setAlistUrl(url: string) {
            this.alistUrl = url
        },
        setAlistSettingShow(show: boolean) {
            this.alistSettingShow = show
        },
        setAlistPlayingShow(show: boolean) {
            this.alistPlayingShow = show
        },
        setAlistPath(path: []) {
            this.alistPath = path
        },
        setAlistData(data: {}) {
            this.alistData = data
        },
        setAlistCurrentPlayIndex(index: number) {
            this.alistCurrentPlayIndex = index
        }
    },
    persist: {
        storage: persistedState.localStorage,
        paths: ['tvCategory', 'alistUrl', 'alistPath', 'alistCurrentPlayIndex', 'alistData']
    },
})