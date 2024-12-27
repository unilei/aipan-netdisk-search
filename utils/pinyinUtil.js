// 拼音工具类
import pinyin from "pinyin";

class PinyinUtil {
  // 生成拼音变体
  static generatePinyinVariants(word) {
    if (!word) return [];

    // 获取完整拼音
    const pinyinArray = pinyin(word, {
      style: pinyin.STYLE_NORMAL,
      heteronym: true,
    });

    const variants = new Set();

    // 添加完整拼音（无声调）
    variants.add(pinyinArray.map((p) => p[0]).join(""));

    // 添加首字母缩写
    variants.add(pinyinArray.map((p) => p[0][0]).join(""));

    // 添加混合变体（首字母+拼音）
    for (let i = 0; i < pinyinArray.length; i++) {
      const mixed = pinyinArray
        .map((p, index) => (index === i ? p[0] : p[0][0]))
        .join("");
      variants.add(mixed);
    }

    return Array.from(variants);
  }
}

export default PinyinUtil;
