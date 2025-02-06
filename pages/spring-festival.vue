<template>
    <div class="spring-festival-container">
        <!-- 顶部区域 -->
        <div
            class="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 py-16 relative overflow-hidden">
            <div class="container mx-auto text-center relative z-10">
                <h1 class="text-4xl md:text-5xl font-bold mb-4 text-white">
                    🐎 2026马年新春特别页面 🧧
                </h1>
                <p class="text-xl text-white/90">祝您新年快乐，万事如意！</p>
            </div>
        </div>

        <!-- 倒计时区域 -->
        <section class="py-8 bg-white dark:bg-gray-800">
            <div class="container mx-auto px-4">
                <div class="max-w-3xl mx-auto text-center">
                    <h2 class="text-2xl font-bold mb-6 text-red-600 dark:text-red-400">
                        距离马年春节还有
                    </h2>
                    <div class="grid grid-cols-4 gap-4">
                        <div class="bg-red-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-3xl font-bold text-red-600 dark:text-red-400">{{ days }}</div>
                            <div class="text-gray-600 dark:text-gray-400">天</div>
                        </div>
                        <div class="bg-red-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-3xl font-bold text-red-600 dark:text-red-400">{{ hours }}</div>
                            <div class="text-gray-600 dark:text-gray-400">时</div>
                        </div>
                        <div class="bg-red-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-3xl font-bold text-red-600 dark:text-red-400">{{ minutes }}</div>
                            <div class="text-gray-600 dark:text-gray-400">分</div>
                        </div>
                        <div class="bg-red-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-3xl font-bold text-red-600 dark:text-red-400">{{ seconds }}</div>
                            <div class="text-gray-600 dark:text-gray-400">秒</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 祝福生成器 -->
        <section class="py-12 bg-white dark:bg-gray-800">
            <div class="container mx-auto px-4">
                <h2 class="text-2xl font-bold mb-8 text-center text-red-600 dark:text-red-400">
                    新年祝福生成器
                </h2>
                <div class="max-w-2xl mx-auto">
                    <div class="bg-red-50 dark:bg-gray-700/50 p-6 rounded-lg border border-red-100 dark:border-red-900">
                        <div class="mb-6">
                            <label class="block text-gray-700 dark:text-gray-300 mb-2">收信人姓名</label>
                            <input v-model="recipient"
                                class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-lg focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 dark:text-white"
                                placeholder="请输入收信人姓名" />
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 dark:text-gray-300 mb-2">选择祝福主题</label>
                            <select v-model="selectedTheme"
                                class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 rounded-lg focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 dark:text-white">
                                <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                        <button @click="generateWishes"
                            class="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                            生成祝福
                        </button>
                        <div v-if="generatedWish"
                            class="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900">
                            <p class="text-lg text-red-600 dark:text-red-400">{{ generatedWish }}</p>
                            <div class="mt-4 flex space-x-4">
                                <button @click="shareWish"
                                    class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center">
                                    <span class="mr-2">分享祝福</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                        fill="currentColor">
                                        <path
                                            d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                    </svg>
                                </button>
                                <button @click="regenerateWish"
                                    class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                                    换一个祝福
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 运势预测 -->
        <section class="py-12 bg-red-50 dark:bg-gray-900">
            <div class="container mx-auto px-4">
                <h2 class="text-2xl font-bold mb-8 text-center text-red-600 dark:text-red-400">
                    马年运势预测
                </h2>
                <div class="max-w-2xl mx-auto">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-red-100 dark:border-red-900">
                        <div class="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
                            <div v-for="animal in zodiacList" :key="animal.value" @click="zodiac = animal.value" :class="[
                                'cursor-pointer p-3 rounded-lg text-center transition-colors duration-200',
                                zodiac === animal.value
                                    ? 'bg-red-50 dark:bg-red-900/30 border border-red-500 dark:border-red-400'
                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                            ]">
                                <span class="text-2xl">{{ animal.emoji }}</span>
                                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ animal.label }}</p>
                            </div>
                        </div>
                        <button @click="checkFortune"
                            class="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                            查看运势
                        </button>
                        <div v-if="fortune" class="mt-6 p-4 bg-red-50 dark:bg-gray-700/50 rounded-lg">
                            <div class="flex items-center mb-4">
                                <span class="text-3xl mr-4">{{ getZodiacEmoji }}</span>
                                <h3 class="text-xl font-medium text-red-600 dark:text-red-400">{{ getZodiacLabel }}的马年运势
                                </h3>
                            </div>
                            <p class="text-gray-700 dark:text-gray-300">{{ fortune }}</p>
                            <div class="mt-4 grid grid-cols-3 gap-4">
                                <div
                                    class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900">
                                    <p class="text-sm text-gray-600 dark:text-gray-400">财运指数</p>
                                    <p class="text-lg font-medium text-red-500">{{ getFortuneLevel('wealth') }}</p>
                                </div>
                                <div
                                    class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900">
                                    <p class="text-sm text-gray-600 dark:text-gray-400">事业指数</p>
                                    <p class="text-lg font-medium text-red-500">{{ getFortuneLevel('career') }}</p>
                                </div>
                                <div
                                    class="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900">
                                    <p class="text-sm text-gray-600 dark:text-gray-400">健康指数</p>
                                    <p class="text-lg font-medium text-red-500">{{ getFortuneLevel('health') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 赞助支持 -->
        <section class="py-12 bg-red-50 dark:bg-gray-900">
            <div class="container mx-auto px-4 text-center">
                <h2 class="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">支持我们</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">您的支持是我们持续提供优质服务的动力</p>
                <NuxtLink to="/donate"
                    class="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                    成为赞助者
                </NuxtLink>
            </div>
        </section>
    </div>
</template>

<script setup>
const recipient = ref('')
const selectedTheme = ref('health')
const zodiac = ref('')
const generatedWish = ref('')
const fortune = ref('')

// SEO配置
useHead({
    title: '2026马年新春特别页面 - AIPAN.ME',
    meta: [
        { name: 'description', content: '2026马年新春特别页面，提供新年祝福生成器、生肖运势查询、新年倒计时等功能。在这里感受浓浓的新年氛围，传递新春祝福。' },
        { name: 'keywords', content: '马年,新年祝福,春节倒计时,生肖运势,新春祝福,2026春节' },
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: '2026马年新春特别页面 - AIPAN.ME' },
        { property: 'og:description', content: '2026马年新春特别页面，提供新年祝福生成器、生肖运势查询、新年倒计时等功能。' },
        { property: 'og:image', content: '/spring-festival-og.jpg' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '2026马年新春特别页面 - AIPAN.ME' },
        { name: 'twitter:description', content: '2026马年新春特别页面，提供新年祝福生成器、生肖运势查询、新年倒计时等功能。' },
        { name: 'twitter:image', content: '/spring-festival-og.jpg' },
        // 其他重要的meta标签
        { name: 'robots', content: 'index,follow' },
        { name: 'author', content: 'AIPAN.ME' },
    ],
    link: [
        { rel: 'canonical', href: 'https://aipan.me/spring-festival' }
    ]
})

// 倒计时相关
const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)


// 2026年春节时间：2026年2月17日
const springFestivalDate = new Date('2026-02-17T00:00:00+08:00')

// 更新倒计时
const updateCountdown = () => {
    const now = new Date()
    const diff = springFestivalDate.getTime() - now.getTime()

    if (diff > 0) {
        days.value = Math.floor(diff / (1000 * 60 * 60 * 24))
        hours.value = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        minutes.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        seconds.value = Math.floor((diff % (1000 * 60)) / 1000)
    } else {
        days.value = 0
        hours.value = 0
        minutes.value = 0
        seconds.value = 0
    }
}

// 启动倒计时
onMounted(() => {
    updateCountdown()
    setInterval(updateCountdown, 1000)
})

// 生肖列表
const zodiacList = [
    { value: 'rat', label: '鼠', emoji: '🐀' },
    { value: 'ox', label: '牛', emoji: '🐂' },
    { value: 'tiger', label: '虎', emoji: '🐅' },
    { value: 'rabbit', label: '兔', emoji: '🐇' },
    { value: 'dragon', label: '龙', emoji: '🐉' },
    { value: 'snake', label: '蛇', emoji: '🐍' },
    { value: 'horse', label: '马', emoji: '🐎' },
    { value: 'goat', label: '羊', emoji: '🐐' },
    { value: 'monkey', label: '猴', emoji: '🐒' },
    { value: 'rooster', label: '鸡', emoji: '🐓' },
    { value: 'dog', label: '狗', emoji: '🐕' },
    { value: 'pig', label: '猪', emoji: '🐖' }
]

// 运势数据
const fortunes = {
    rat: {
        text: '与马相冲，需要谨慎行事，但贵人运旺盛。建议多结交新朋友，可能带来意想不到的机遇。',
        wealth: 3,
        career: 4,
        health: 3
    },
    ox: {
        text: '运势平稳，事业有新突破。工作中会遇到良好机会，把握住就能更上一层楼。',
        wealth: 4,
        career: 5,
        health: 4
    },
    tiger: {
        text: '财运亨通，人际关系和谐。投资理财有望获得不错收益，但要注意风险控制。',
        wealth: 5,
        career: 4,
        health: 4
    },
    rabbit: {
        text: '桃花运旺，有意外之财。感情生活将迎来转机，单身的有望遇到心仪对象。',
        wealth: 4,
        career: 3,
        health: 5
    },
    dragon: {
        text: '与马相合，诸事顺遂，好运连连。创业者会遇到好机会，适大展拳脚。',
        wealth: 5,
        career: 5,
        health: 4
    },
    snake: {
        text: '运势平稳，事业有新突破。注意调节作息，保持健康。',
        wealth: 4,
        career: 5,
        health: 3
    },
    horse: {
        text: '本命年运势旺盛，事业有重大突破。注意平衡工作与休息，保持健康。',
        wealth: 5,
        career: 5,
        health: 4
    },
    goat: {
        text: '财运不错，感情稳定。理财投资会有不错收益，感情生活温馨甜蜜。',
        wealth: 5,
        career: 4,
        health: 4
    },
    monkey: {
        text: '事业运佳，小心健康。工作上会有重大突破，但要注意身体，适当放松。',
        wealth: 4,
        career: 5,
        health: 3
    },
    rooster: {
        text: '人缘极好，财运渐旺。社交圈会带来意外惊喜，投资理财较为顺利。',
        wealth: 5,
        career: 4,
        health: 4
    },
    dog: {
        text: '工作顺利，注意休息。事业发展稳中有进，要劳逸结合，保持身体。',
        wealth: 4,
        career: 4,
        health: 3
    },
    pig: {
        text: '贵人运旺，财运上升。会得到贵人相助，投资机会增多，要谨慎对待。',
        wealth: 5,
        career: 4,
        health: 4
    }
}

// 计算属性
const getZodiacEmoji = computed(() => {
    const animal = zodiacList.find(a => a.value === zodiac.value)
    return animal ? animal.emoji : ''
})

const getZodiacLabel = computed(() => {
    const animal = zodiacList.find(a => a.value === zodiac.value)
    return animal ? animal.label : ''
})

// 获取运势等级
const getFortuneLevel = (type) => {
    if (!zodiac.value || !fortunes[zodiac.value]) return ''
    const level = fortunes[zodiac.value][type]
    return '⭐'.repeat(level)
}

const generateWishes = () => {
    if (!recipient.value) {
        alert('请输入收信人姓名')
        return
    }
    const wishList = wishesTemplate[selectedTheme.value]
    const randomWish = wishList[Math.floor(Math.random() * wishList.length)]
    generatedWish.value = `亲爱的${recipient.value}，${randomWish}`
}

const regenerateWish = () => {
    generateWishes()
}

const checkFortune = () => {
    if (!zodiac.value) {
        alert('请选择生肖')
        return
    }
    fortune.value = fortunes[zodiac.value].text
}

const shareWish = () => {
    if (navigator.share) {
        navigator.share({
            title: '新年祝福',
            text: generatedWish.value,
            url: window.location.href
        }).catch(console.error)
    } else {
        alert('已复制祝福语到剪贴板')
        navigator.clipboard.writeText(generatedWish.value)
    }
}

// 修改选择框的选项
const themeOptions = [
    { value: 'health', label: '健康平安' },
    { value: 'wealth', label: '财运亨通' },
    { value: 'career', label: '事业有成' },
    { value: 'love', label: '幸福美满' },
    { value: 'family', label: '阖家欢乐' },
    { value: 'study', label: '学业进步' },
    { value: 'business', label: '生意兴隆' },
    { value: 'friendship', label: '朋友情谊' },
    { value: 'hobby', label: '兴趣爱好' },
    { value: 'travel', label: '旅行祝福' },
    { value: 'funny', label: '幽默祝福' }
]

// 扩展祝福语模板
const wishesTemplate = {
    health: [
        '祝您新年健康如意，活力永驻！',
        '愿您马年像骏马一样健壮，身体倍儿棒！',
        '祝您新年营养均衡，身体倍棒，连医生都记不住您长啥样！',
        '愿您马年精力充沛，运动健身，体魄强健如骏马！',
        '祝您马年免疫力比长城还强大，病毒见了都绕道走！'
    ],
    travel: [
        '祝您马年旅行顺利，一路平安！',
        '愿您新年周游世界，收获满满！',
        '祝您马年旅途精彩，平安喜乐！',
        '愿您马年走遍天下，足迹比千里马还广！',
        '祝您新年出门旅游，玩得比骏马奔腾还痛快！'
    ],
    family: [
        '祝您新年家庭美满，和乐融融！',
        '愿您马年全家和睦得像骏马奔腾，开心得像过年天天串门！',
        '祝您新年家里温暖得像马厩，和睦得连邻居都羡慕！',
        '愿您马年家庭欢乐得像过年，天天都是团圆饭！',
        '祝您新年家里笑声不断，快乐得连门口的对联都笑歪了！'
    ]
}
</script>

<style scoped>
.spring-festival-container {
    min-height: 100vh;
}

/* 修复一些中文字编码问题 */
.text-fix {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}
</style>