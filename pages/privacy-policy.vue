<script setup>
definePageMeta({
  layout: "netdisk",
});

useHead({
  title: '隐私政策 - AIPAN.ME',
  meta: [
    { name: 'description', content: 'AIPAN.ME隐私政策，详细说明个人信息的收集、使用、存储、保护及用户权利。' },
    { name: 'keywords', content: '隐私政策,个人信息保护,数据安全,GDPR,用户权利' },
  ]
})
</script>

<template>
  <div class="min-h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-900 py-16">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          隐私政策
        </h1>
        
        <div class="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          最后更新：{{ new Date().getFullYear() }}-{{ String(new Date().getMonth() + 1).padStart(2, '0') }}-{{ String(new Date().getDate()).padStart(2, '0') }}
        </div>

        <div class="space-y-8 text-gray-600 dark:text-gray-300">
          
          <!-- 引言 -->
          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 border-l-4 border-blue-500">
            <h2 class="font-bold text-blue-700 dark:text-blue-300 text-lg mb-3">
              <i class="fas fa-shield-alt mr-2"></i>隐私保护承诺
            </h2>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              AIPAN.ME（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规要求，采取安全保护措施，保护您的个人信息安全可控。
            </p>
            <p class="text-gray-700 dark:text-gray-300"><strong>本隐私政策将帮助您了解：</strong></p>
            <ul class="list-disc list-inside space-y-1 ml-4 mt-2 text-gray-700 dark:text-gray-300">
              <li>我们如何收集和使用您的个人信息</li>
              <li>我们如何存储和保护您的个人信息</li>
              <li>我们如何共享、转让、公开披露您的个人信息</li>
              <li>您如何管理自己的个人信息</li>
            </ul>
          </div>

          <!-- 第一部分 -->
          <section>
            <h2 class="section-title">一、我们如何收集和使用您的个人信息</h2>
            
            <div class="space-y-4 pl-4">
              <div>
                <p class="font-semibold mb-2">1.1 账号注册信息</p>
                <div class="info-box">
                  <p class="mb-2">注册账号时我们会收集：</p>
                  <ul class="list-disc list-inside space-y-1 ml-4">
                    <li><strong>用户名</strong>（必需）- 用于账号识别和登录</li>
                    <li><strong>电子邮箱</strong>（必需）- 用于账号验证、密码找回、重要通知</li>
                    <li><strong>密码</strong>（必需）- 使用 bcrypt + salt 加密存储</li>
                    <li><strong>头像风格</strong>（可选）- 用于个性化展示</li>
                  </ul>
                </div>
              </div>

              <div>
                <p class="font-semibold mb-2">1.2 使用服务时收集的信息</p>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li><strong>日志信息：</strong>设备型号、操作系统、浏览器类型、IP地址、访问时间、访问页面</li>
                  <li><strong>搜索记录：</strong>搜索关键词（用于统计分析和改进服务）</li>
                  <li><strong>用户内容：</strong>博客文章、论坛帖子、评论、聊天消息</li>
                  <li><strong>Cookie：</strong>用于保持登录状态、记住偏好设置、分析网站流量</li>
                </ul>
              </div>

              <div>
                <p class="font-semibold mb-2">1.3 第三方服务</p>
                <div class="warning-box">
                  <p class="mb-2">我们可能使用以下第三方服务：</p>
                  <ul class="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Google Analytics</strong> - 网站流量分析</li>
                    <li><strong>Google AdSense</strong> - 广告投放（如适用）</li>
                    <li><strong>Cloudflare</strong> - CDN 和安全防护</li>
                  </ul>
                  <p class="text-sm mt-2">这些服务有各自的隐私政策，建议您查阅了解。</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 第二部分 -->
          <section>
            <h2 class="section-title">二、我们如何存储和保护您的个人信息</h2>
            
            <div class="space-y-4 pl-4">
              <div>
                <p class="font-semibold mb-2">2.1 存储地点和期限</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li><strong>存储地点：</strong>中国境内服务器</li>
                  <li><strong>账号信息：</strong>使用期间持续保存，注销后删除</li>
                  <li><strong>日志信息：</strong>保存 180 天</li>
                  <li><strong>用户内容：</strong>主动删除或注销后删除</li>
                </ul>
              </div>

              <div>
                <p class="font-semibold mb-2">2.2 安全措施</p>
                <div class="success-box">
                  <ul class="list-disc list-inside space-y-2">
                    <li><strong>数据加密：</strong>HTTPS 传输加密，密码 bcrypt + salt 加密</li>
                    <li><strong>访问控制：</strong>严格权限管理，最小化数据访问</li>
                    <li><strong>安全审计：</strong>定期安全评估和漏洞扫描</li>
                    <li><strong>数据备份：</strong>定期备份，防止数据丢失</li>
                    <li><strong>安全监控：</strong>实时监控异常访问和攻击</li>
                  </ul>
                </div>
              </div>

              <div>
                <p class="font-semibold mb-2">2.3 安全事件应对</p>
                <p class="mb-2">如发生个人信息安全事件，我们将：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>立即启动应急预案</li>
                  <li>评估影响范围和严重程度</li>
                  <li>向监管部门报告</li>
                  <li>及时通知受影响用户</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- 第三部分 -->
          <section>
            <h2 class="section-title">三、我们如何共享、转让、公开披露您的个人信息</h2>
            
            <div class="space-y-4 pl-4">
              <p class="font-semibold mb-2">3.1 原则声明</p>
              <p class="mb-3">我们不会与第三方共享您的个人信息，除非：</p>
              
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>获得您的明确同意</strong></li>
                <li><strong>法律法规要求：</strong>根据法律、法律程序、诉讼或政府要求</li>
                <li><strong>服务提供商：</strong>与提供技术服务的第三方共享必要信息（受保密义务约束）</li>
                <li><strong>统计数据：</strong>与合作伙伴共享已去标识化的统计数据</li>
              </ul>

              <div class="warning-box mt-4">
                <p><i class="fas fa-exclamation-triangle mr-2"></i><strong>公开信息提示：</strong></p>
                <p class="mt-2">您主动公开发布的内容（论坛帖子、博客文章、评论等）将被视为公开信息，任何人都可查看。请谨慎发布包含个人信息的内容。</p>
              </div>
            </div>
          </section>

          <!-- 第四部分 -->
          <section>
            <h2 class="section-title">四、您的权利</h2>
            
            <div class="space-y-4 pl-4">
              <div class="info-box mb-4">
                <p class="font-semibold mb-2">按照中国法律和GDPR，您享有以下权利：</p>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div class="right-item">
                  <h3><i class="fas fa-eye mr-2"></i>访问权</h3>
                  <p>您有权访问您的个人信息</p>
                </div>

                <div class="right-item">
                  <h3><i class="fas fa-edit mr-2"></i>更正权</h3>
                  <p>发现信息有误时，您可要求更正</p>
                </div>

                <div class="right-item">
                  <h3><i class="fas fa-trash mr-2"></i>删除权</h3>
                  <p>在特定情形下，您可要求删除信息</p>
                </div>

                <div class="right-item">
                  <h3><i class="fas fa-ban mr-2"></i>撤回同意</h3>
                  <p>您可随时撤回之前给予的同意</p>
                </div>

                <div class="right-item">
                  <h3><i class="fas fa-user-times mr-2"></i>注销账号</h3>
                  <p>您可随时申请注销账号</p>
                </div>

                <div class="right-item">
                  <h3><i class="fas fa-download mr-2"></i>数据副本</h3>
                  <p>您有权获取个人信息副本</p>
                </div>
              </div>

              <div class="contact-box mt-6">
                <p class="font-semibold mb-2"><i class="fas fa-paper-plane mr-2"></i>如何行使您的权利</p>
                <p class="mb-2">请通过以下方式联系我们：</p>
                <ul class="list-none space-y-1">
                  <li><i class="fas fa-envelope mr-2 text-blue-500"></i>邮箱：ahagwybwqs@gmail.com</li>
                  <li><i class="fas fa-clock mr-2 text-blue-500"></i>响应时间：15个工作日内</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- 第五部分 -->
          <section>
            <h2 class="section-title">五、未成年人保护</h2>
            
            <div class="space-y-3 pl-4">
              <p>我们重视未成年人的个人信息保护。如您为未成年人（18周岁以下），请在监护人的陪同下阅读本政策，并在监护人同意的情况下使用我们的服务。</p>
              
              <div class="warning-box">
                <p class="font-semibold mb-2"><i class="fas fa-child mr-2"></i>监护人须知：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>请指导被监护人正确使用本站服务</li>
                  <li>请监督被监护人发布的内容</li>
                  <li><strong>14周岁以下儿童使用需获得您的明确同意</strong></li>
                  <li>如发现未经同意收集了未成年人信息，请立即联系我们</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- 第六部分 -->
          <section>
            <h2 class="section-title">六、隐私政策的更新</h2>
            
            <div class="space-y-3 pl-4">
              <p>我们可能根据业务调整或法律要求更新本隐私政策。更新后的政策将在本页面公布。</p>
              
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>重大变更：</strong>我们会通过站内信、邮件等方式通知您</li>
                <li><strong>继续使用：</strong>更新后继续使用服务，视为同意新政策</li>
                <li><strong>不同意：</strong>您可停止使用服务并注销账号</li>
              </ul>
            </div>
          </section>

          <!-- 第七部分 -->
          <section>
            <h2 class="section-title">七、联系我们</h2>
            
            <div class="space-y-3 pl-4">
              <p>如您对本隐私政策有任何疑问、意见或建议，或需要行使您的权利，请联系我们：</p>
              
              <div class="contact-box">
                <ul class="list-none space-y-2">
                  <li><i class="fas fa-envelope mr-2 text-blue-500"></i><strong>电子邮箱：</strong>ahagwybwqs@gmail.com</li>
                  <li><i class="fas fa-clock mr-2 text-blue-500"></i><strong>响应时间：</strong>15个工作日内回复</li>
                  <li><i class="fas fa-shield-alt mr-2 text-blue-500"></i><strong>个人信息保护负责人：</strong>通过上述邮箱联系</li>
                </ul>
              </div>

              <p class="text-sm mt-4 text-gray-600 dark:text-gray-400">
                如您对我们的回复不满意，可向网信、电信、公安及工商等监管部门投诉举报，或通过提起诉讼等方式寻求解决。
              </p>
            </div>
          </section>

          <!-- 底部确认 -->
          <div class="final-notice">
            <div class="flex items-start space-x-3">
              <i class="fas fa-check-circle text-2xl text-blue-500 mt-1"></i>
              <div>
                <p class="font-bold text-gray-900 dark:text-white mb-2">感谢您的信任</p>
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                  我们承诺严格遵守本隐私政策的各项约定，保护您的个人信息安全。
                  如您继续使用 AIPAN.ME 的服务，即表示您已阅读、理解并同意本隐私政策的全部内容。
                </p>
              </div>
            </div>
          </div>

          <!-- 相关链接 -->
          <div class="related-links">
            <p class="font-semibold mb-3">相关文档：</p>
            <div class="grid md:grid-cols-3 gap-3">
              <nuxt-link to="/user-agreement" class="link-card">
                <i class="fas fa-file-contract mr-2"></i>用户服务协议
              </nuxt-link>
              <nuxt-link to="/disclaimer" class="link-card">
                <i class="fas fa-exclamation-triangle mr-2"></i>免责声明
              </nuxt-link>
              <nuxt-link to="/copyright" class="link-card">
                <i class="fas fa-copyright mr-2"></i>侵权投诉
              </nuxt-link>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
section {
  @apply border-b border-gray-200 dark:border-gray-700 pb-6;
}

section:last-of-type {
  @apply border-b-0;
}

.section-title {
  @apply text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center;
}

.section-title::before {
  content: '';
  @apply w-1 h-6 bg-blue-500 mr-3 rounded;
}

.info-box {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4;
}

.warning-box {
  @apply bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 border-l-4 border-yellow-500;
}

.success-box {
  @apply bg-green-50 dark:bg-green-900/30 rounded-lg p-4;
}

.contact-box {
  @apply bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border-l-4 border-blue-500;
}

.right-item {
  @apply bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

.right-item h3 {
  @apply font-semibold text-gray-900 dark:text-white mb-2;
}

.right-item p {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.final-notice {
  @apply bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700;
}

.related-links {
  @apply bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700;
}

.link-card {
  @apply block p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400;
}

p {
  @apply leading-relaxed;
}
</style>
