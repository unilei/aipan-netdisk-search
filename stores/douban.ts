import {defineStore} from "pinia";
export const useDoubanStore = defineStore('douban', {
    state() {
        return {
            doubanData: []
        }
    },
    actions: {
        async getDoubanData() {
            let res:any = await $fetch('/api/douban/new')
            if (res.code === 200) {
                this.doubanData = res.data
            }
        }
    },
    persist: {
        storage: persistedState.localStorage
    },
})