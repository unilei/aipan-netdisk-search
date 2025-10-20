<script setup>
definePageMeta({
  layout: "netdisk",
});

// SEO配置
useHead({
  title: '用户服务协议 - AIPAN.ME',
  meta: [
    { name: 'description', content: 'AIPAN.ME用户服务协议，详细说明用户权利与义务、服务条款、免责声明等重要内容。' },
    { name: 'keywords', content: '用户协议,服务条款,使用规则,法律声明,AIPAN' },
  ]
})
</script>

<template>
  <div class="min-h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-900 py-16">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          用户服务协议
        </h1>
        
        <div class="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          最后更新日期：{{ new Date().getFullYear() }}年{{ new Date().getMonth() + 1 }}月{{ new Date().getDate() }}日
        </div>

        <div class="space-y-8 text-gray-600 dark:text-gray-300">
          
          <!-- 重要提示 -->
          <div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-5 border-l-4 border-red-500">
            <h2 class="font-bold text-red-700 dark:text-red-300 text-lg mb-2">
              <i class="fas fa-exclamation-circle mr-2"></i>重要提示
            </h2>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              在使用 AIPAN.ME（以下简称"本站"或"我们"）提供的服务之前，请您务必仔细阅读并充分理解本协议的全部内容。
              <strong>您点击"同意"按钮或实际使用本站服务，即表示您已阅读、理解并同意接受本协议的约束。</strong>
              如您不同意本协议的任何内容，请立即停止使用本站服务。
            </p>
          </div>

          <!-- 第一条：协议的范围和修改 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第一条 协议的范围和修改
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>1.1 协议范围</strong></p>
              <p>本协议是您与 AIPAN.ME 之间关于使用本站服务所订立的协议。本站提供的服务包括但不限于：网盘资源搜索、在线视频播放、音乐播放、博客系统、论坛社区、聊天功能等。</p>
              
              <p><strong>1.2 协议修改</strong></p>
              <p>我们有权根据业务调整或法律法规要求随时修改本协议。修改后的协议将在本站公布，并在公布之日起生效。如您在协议修改后继续使用本站服务，即视为您已接受修改后的协议。建议您定期查看本协议内容。</p>
            </div>
          </section>

          <!-- 第二条：服务说明 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第二条 服务说明
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>2.1 服务内容</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>搜索服务：</strong>提供网盘资源信息检索服务，搜索结果来自互联网公开内容</li>
                <li><strong>内容服务：</strong>提供音乐、视频在线播放功能（内容来源于第三方平台）</li>
                <li><strong>社区服务：</strong>提供博客发布、论坛交流、即时聊天等UGC功能</li>
                <li><strong>用户服务：</strong>提供账号注册、积分系统、签到等用户功能</li>
              </ul>

              <p><strong>2.2 服务性质</strong></p>
              <p>本站是一个技术学习和交流平台，主要用于：</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>个人学习和技术研究</li>
                <li>非商业性质的信息检索</li>
                <li>合法内容的分享与交流</li>
              </ul>

              <p><strong>2.3 服务限制</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>本站不存储、上传、复制或传播任何资源文件</li>
                <li>本站仅作为信息检索工具，不对第三方资源的准确性、合法性负责</li>
                <li>本站保留随时修改、中断或终止部分或全部服务的权利</li>
              </ul>
            </div>
          </section>

          <!-- 第三条：账号注册与使用 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第三条 账号注册与使用
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>3.1 注册资格</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>您必须年满 18 周岁或在监护人的同意下使用本站服务</li>
                <li>您应具备完全民事权利能力和民事行为能力</li>
                <li>您承诺提供的注册信息真实、准确、完整</li>
              </ul>

              <p><strong>3.2 账号安全</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>您有责任保管好自己的账号和密码</li>
                <li>您对账号下的所有行为承担全部责任</li>
                <li>如发现账号被盗用，应立即通知本站</li>
                <li>本站不对因您保管不善造成的损失承担责任</li>
              </ul>

              <p><strong>3.3 账号使用规范</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>一人仅能注册一个账号</li>
                <li>不得将账号出售、出租、转让给他人</li>
                <li>不得使用他人账号或冒充他人身份</li>
                <li>不得使用侮辱性、诽谤性或违法的用户名</li>
              </ul>
            </div>
          </section>

          <!-- 第四条：用户行为规范 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第四条 用户行为规范
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>4.1 您承诺遵守以下规定：</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>遵守中华人民共和国相关法律法规</li>
                <li>遵守本协议及本站发布的各项规则</li>
                <li>尊重其他用户的合法权益</li>
                <li>不传播虚假信息或有害信息</li>
                <li>不从事任何商业行为或盈利活动</li>
              </ul>

              <p><strong>4.2 您不得从事以下行为：</strong></p>
              <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded p-4 space-y-2">
                <p class="font-semibold text-yellow-800 dark:text-yellow-200">严禁发布以下内容：</p>
                <ul class="list-disc list-inside space-y-1 ml-4 text-gray-700 dark:text-gray-300">
                  <li>反对宪法所确定的基本原则的内容</li>
                  <li>危害国家安全、泄露国家秘密的内容</li>
                  <li>颠覆国家政权、推翻社会主义制度的内容</li>
                  <li>破坏国家统一、损害民族团结的内容</li>
                  <li>宣扬邪教、迷信、淫秽、色情、赌博、暴力的内容</li>
                  <li>侮辱、诽谤他人，侵害他人合法权益的内容</li>
                  <li>煽动非法集会、结社、游行、示威的内容</li>
                  <li>侵犯他人知识产权的内容</li>
                  <li>包含病毒、木马、恶意代码的内容</li>
                  <li>其他违反法律法规或公序良俗的内容</li>
                </ul>
              </div>

              <p><strong>4.3 禁止的技术行为：</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>使用爬虫、机器人等自动化手段访问本站</li>
                <li>对本站进行反向工程、反编译或破解</li>
                <li>攻击、入侵本站服务器或数据库</li>
                <li>干扰本站正常运营或其他用户正常使用</li>
                <li>绕过本站的安全措施或访问控制</li>
              </ul>
            </div>
          </section>

          <!-- 第五条：知识产权 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第五条 知识产权
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>5.1 本站知识产权</strong></p>
              <p>本站的标识、名称、界面设计、程序代码、文档等，其知识产权归本站或相关权利人所有。未经许可，您不得擅自使用、复制、修改、传播。</p>

              <p><strong>5.2 用户内容的知识产权</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>您发布的原创内容，其知识产权归您所有</li>
                <li>您发布内容即授予本站免费的、非独占的使用权</li>
                <li>本站有权对您发布的内容进行审核、编辑或删除</li>
                <li>您应确保发布的内容不侵犯他人知识产权</li>
              </ul>

              <p><strong>5.3 侵权处理</strong></p>
              <p>如您发现本站存在侵犯您知识产权的内容，请通过<nuxt-link to="/copyright" class="text-blue-500 hover:underline">侵权投诉</nuxt-link>页面与我们联系。我们将在收到有效投诉后及时处理。</p>
            </div>
          </section>

          <!-- 第六条：隐私保护 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第六条 隐私保护
            </h2>
            <div class="space-y-3 pl-4">
              <p>我们重视用户隐私保护，关于个人信息的收集、使用、存储、共享等详细内容，请查看我们的
                <nuxt-link to="/privacy-policy" class="text-blue-500 hover:underline font-semibold">《隐私政策》</nuxt-link>。
              </p>
              <p>使用本站服务即表示您同意我们按照《隐私政策》处理您的个人信息。</p>
            </div>
          </section>

          <!-- 第七条：免责声明 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第七条 免责声明
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>7.1 服务中断</strong></p>
              <p>因以下情况导致的服务中断或无法使用，本站不承担责任：</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>系统维护、升级、故障</li>
                <li>不可抗力（如自然灾害、战争、政府行为等）</li>
                <li>第三方服务提供商的原因</li>
                <li>您的设备、网络、软件等原因</li>
                <li>黑客攻击、病毒侵袭等网络安全事件</li>
              </ul>

              <p><strong>7.2 第三方内容</strong></p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>本站不对第三方网站或资源的准确性、合法性、安全性负责</li>
                <li>本站不对用户发布的内容进行事先审查或背书</li>
                <li>用户访问第三方链接或使用第三方资源的风险自负</li>
              </ul>

              <p><strong>7.3 用户损失</strong></p>
              <p>除法律另有规定外，本站不对以下损失承担责任：</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>因使用或无法使用本站服务而产生的损失</li>
                <li>因第三方侵权行为造成的损失</li>
                <li>因信赖本站内容而产生的损失</li>
                <li>因网络延迟、故障等技术原因造成的损失</li>
              </ul>
            </div>
          </section>

          <!-- 第八条：违约责任 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第八条 违约责任
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>8.1 违约行为</strong></p>
              <p>如您违反本协议的任何约定，即构成违约。本站有权采取以下措施：</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>删除违规内容</li>
                <li>限制账号功能</li>
                <li>暂停或终止服务</li>
                <li>封禁账号</li>
                <li>追究法律责任</li>
              </ul>

              <p><strong>8.2 损害赔偿</strong></p>
              <p>如您的违约行为给本站或其他用户造成损失的，您应承担赔偿责任，包括但不限于直接损失、间接损失、律师费、诉讼费等。</p>
            </div>
          </section>

          <!-- 第九条：协议终止 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第九条 协议终止
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>9.1 用户终止</strong></p>
              <p>您可以随时通过注销账号的方式终止本协议。账号注销后，您的所有数据将被删除且无法恢复。</p>

              <p><strong>9.2 本站终止</strong></p>
              <p>如出现以下情况，本站有权终止向您提供服务：</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>您违反本协议的约定</li>
                <li>您提供虚假注册信息</li>
                <li>您的账号长期未使用</li>
                <li>本站停止运营</li>
                <li>法律法规要求终止</li>
              </ul>

              <p><strong>9.3 终止后果</strong></p>
              <p>协议终止后，本站无义务保留您的任何信息，也无义务向您或第三方转发任何未读或未发送的信息。</p>
            </div>
          </section>

          <!-- 第十条：法律适用与争议解决 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第十条 法律适用与争议解决
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>10.1 法律适用</strong></p>
              <p>本协议的签订、履行、解释及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。</p>

              <p><strong>10.2 争议解决</strong></p>
              <p>如双方就本协议内容或执行发生争议，应友好协商解决；协商不成的，任何一方均可向本站所在地有管辖权的人民法院提起诉讼。</p>
            </div>
          </section>

          <!-- 第十一条：其他条款 -->
          <section>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              第十一条 其他条款
            </h2>
            <div class="space-y-3 pl-4">
              <p><strong>11.1 可分割性</strong></p>
              <p>如本协议的任何条款被认定为无效或不可执行，该条款应被解释为反映各方的原意，其他条款继续有效。</p>

              <p><strong>11.2 完整协议</strong></p>
              <p>本协议构成您与本站之间的完整协议，取代此前的所有口头或书面协议。</p>

              <p><strong>11.3 联系方式</strong></p>
              <p>如您对本协议有任何疑问或建议，请通过以下方式联系我们：</p>
              <ul class="list-none space-y-2 ml-4">
                <li><i class="fas fa-envelope mr-2 text-blue-500"></i>邮箱：ahagwybwqs@gmail.com</li>
              </ul>
            </div>
          </section>

          <!-- 底部确认 -->
          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 border-l-4 border-blue-500 mt-8">
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              <i class="fas fa-check-circle mr-2 text-blue-500"></i>
              <strong>再次提醒：</strong>本协议是您与 AIPAN.ME 之间具有法律效力的文件。
              请您务必仔细阅读、充分理解各条款内容，特别是免责条款和法律适用条款。
              如您继续使用本站服务，即表示您已完全理解并同意遵守本协议的全部内容。
            </p>
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

p {
  @apply leading-relaxed;
}

h2 {
  @apply flex items-center;
}

h2::before {
  content: '';
  @apply w-1 h-6 bg-blue-500 mr-3 rounded;
}
</style>
