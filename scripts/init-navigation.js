import { PrismaClient } from "~/generated/prisma/client";

const prisma = new PrismaClient();

async function initNavigationData() {
  try {
    console.log("开始初始化导航数据...");

    // 检查是否已有数据
    const existingCategories = await prisma.navigationCategory.count();
    if (existingCategories > 0) {
      console.log("导航数据已存在，跳过初始化");
      return;
    }

    // 创建导航分类
    const categories = [
      {
        name: "搜索工具",
        slug: "search",
        sortOrder: 1,
        items: [
          {
            title: "网盘搜索",
            path: "/search",
            icon: "fa-search",
            sortOrder: 1,
          },
          {
            title: "磁力搜索",
            path: "/magnet",
            icon: "fa-magnet",
            sortOrder: 2,
          },
          {
            title: "学术搜索",
            path: "/academic",
            icon: "fa-graduation-cap",
            sortOrder: 3,
          },
        ],
      },
      {
        name: "娱乐工具",
        slug: "entertainment",
        sortOrder: 2,
        items: [
          { title: "音乐下载", path: "/music", icon: "fa-music", sortOrder: 1 },
          {
            title: "VIP视频解析",
            path: "/freebox",
            icon: "fa-play-circle",
            sortOrder: 2,
          },
          { title: "TV直播", path: "/tv", icon: "fa-tv", sortOrder: 3 },
          { title: "小说阅读", path: "/novel", icon: "fa-book", sortOrder: 4 },
        ],
      },
      {
        name: "实用工具",
        slug: "tools",
        sortOrder: 3,
        items: [
          {
            title: "图片工具",
            path: "/image-tools",
            icon: "fa-image",
            sortOrder: 1,
          },
          {
            title: "文档转换",
            path: "/converter",
            icon: "fa-file-alt",
            sortOrder: 2,
          },
          {
            title: "二维码生成",
            path: "/qrcode",
            icon: "fa-qrcode",
            sortOrder: 3,
          },
          {
            title: "短链生成",
            path: "/shorturl",
            icon: "fa-link",
            sortOrder: 4,
          },
        ],
      },
      {
        name: "学习工具",
        slug: "learning",
        sortOrder: 4,
        items: [
          {
            title: "英语学习",
            path: "/english",
            icon: "fa-language",
            sortOrder: 1,
          },
          { title: "编程学习", path: "/coding", icon: "fa-code", sortOrder: 2 },
          {
            title: "在线课程",
            path: "/courses",
            icon: "fa-chalkboard-teacher",
            sortOrder: 3,
          },
        ],
      },
      {
        name: "其他",
        slug: "others",
        sortOrder: 5,
        items: [
          { title: "博客", path: "/blog", icon: "fa-blog", sortOrder: 1 },
          {
            title: "关于我们",
            path: "/about",
            icon: "fa-info-circle",
            sortOrder: 2,
          },
          {
            title: "联系我们",
            path: "/contact",
            icon: "fa-envelope",
            sortOrder: 3,
          },
        ],
      },
    ];

    // 创建分类和导航项
    for (const categoryData of categories) {
      const { items, ...categoryInfo } = categoryData;

      // 创建分类
      const category = await prisma.navigationCategory.create({
        data: categoryInfo,
      });

      console.log(`创建分类: ${category.name}`);

      // 创建导航项
      for (const itemData of items) {
        const item = await prisma.navigationItem.create({
          data: {
            ...itemData,
            categoryId: category.id,
          },
        });
        console.log(`  - 创建导航项: ${item.title}`);
      }
    }

    console.log("导航数据初始化完成！");
  } catch (error) {
    console.error("初始化导航数据失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initNavigationData()
    .then(() => {
      console.log("脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("脚本执行失败:", error);
      process.exit(1);
    });
}

export { initNavigationData };
