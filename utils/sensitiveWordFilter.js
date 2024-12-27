// 敏感词过滤器
import { cultWords } from "./keywords/cult";
import { fraudWords } from "./keywords/fraud";
import { illegalFinanceWords } from "./keywords/illegal_finance";
import { pyramidSchemeWords } from "./keywords/pyramid_scheme";

import { violenceWords } from "./keywords/violence";
import { pornWords } from "./keywords/porn";
import { politicalWords } from "./keywords/political";
import { gamblingWords } from "./keywords/gambling";

class SensitiveWordFilter {
  constructor() {
    this.sensitiveWordMap = new Map();
    this.init();
  }

  // 初始化，构建DFA算法所需的敏感词字典树
  init() {
    // 合并所有类别的敏感词
    const allWords = [
      ...fraudWords,
      ...illegalFinanceWords,
      ...pyramidSchemeWords,
      ...cultWords,
      ...violenceWords,
      ...pornWords,
      ...politicalWords,
      ...gamblingWords,
    ];

    // 构建DFA字典树
    allWords.forEach((word) => {
      let currentMap = this.sensitiveWordMap;
      for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i);
        let wordMap = currentMap.get(char);

        if (wordMap) {
          currentMap = wordMap;
        } else {
          wordMap = new Map();
          currentMap.set(char, wordMap);
          currentMap = wordMap;
        }

        // 标记结束
        if (i === word.length - 1) {
          currentMap.set("isEnd", true);
        }
      }
    });
  }

  // 检查文本中是否包含敏感词
  hasSensitiveWords(text) {
    if (!text) return false;

    for (let i = 0; i < text.length; i++) {
      const length = this.checkSensitiveWord(text, i);
      if (length > 0) {
        return true;
      }
    }
    return false;
  }

  // 查找所有敏感词
  findSensitiveWords(text) {
    if (!text) return [];

    const sensitiveWords = new Set();
    for (let i = 0; i < text.length; i++) {
      const length = this.checkSensitiveWord(text, i);
      if (length > 0) {
        const word = text.substr(i, length);
        sensitiveWords.add(word);
      }
    }
    return Array.from(sensitiveWords);
  }

  // 替换敏感词
  filter(text, replaceChar = "*") {
    if (!text) return text;

    let result = text;
    const sensitiveWords = this.findSensitiveWords(text);

    sensitiveWords.forEach((word) => {
      const reg = new RegExp(word, "g");
      const replacement = replaceChar.repeat(word.length);
      result = result.replace(reg, replacement);
    });

    return result;
  }

  // 检查从指定位置开始的敏感词长度
  checkSensitiveWord(text, beginIndex) {
    let currentMap = this.sensitiveWordMap;
    let wordLength = 0;
    let tempLength = 0;

    for (let i = beginIndex; i < text.length; i++) {
      const char = text.charAt(i);
      const wordMap = currentMap.get(char);

      if (wordMap) {
        tempLength++;
        currentMap = wordMap;

        if (currentMap.get("isEnd")) {
          wordLength = tempLength;
        }
      } else {
        break;
      }
    }

    return wordLength;
  }

  // 添加自定义敏感词
  addSensitiveWord(word) {
    if (!word) return;

    let currentMap = this.sensitiveWordMap;
    for (let i = 0; i < word.length; i++) {
      const char = word.charAt(i);
      let wordMap = currentMap.get(char);

      if (wordMap) {
        currentMap = wordMap;
      } else {
        wordMap = new Map();
        currentMap.set(char, wordMap);
        currentMap = wordMap;
      }

      if (i === word.length - 1) {
        currentMap.set("isEnd", true);
      }
    }
  }

  // 移除敏感词
  removeSensitiveWord(word) {
    if (!word) return;

    let currentMap = this.sensitiveWordMap;
    const mapStack = [currentMap];
    const charStack = [word.charAt(0)];

    // 遍历查找要删除的敏感词路径
    for (let i = 0; i < word.length; i++) {
      const char = word.charAt(i);
      const wordMap = currentMap.get(char);

      if (!wordMap) return; // 词不存在，直接���回

      if (i < word.length - 1) {
        currentMap = wordMap;
        mapStack.push(currentMap);
        charStack.push(word.charAt(i + 1));
      } else {
        // 找到完整词后，删除标记
        wordMap.delete("isEnd");
      }
    }

    // 从后向前清理空节点
    for (let i = mapStack.length - 1; i >= 0; i--) {
      const map = mapStack[i];
      const char = charStack[i];

      if (map.size === 0) {
        if (i > 0) {
          mapStack[i - 1].delete(char);
        }
      } else {
        break;
      }
    }
  }
}

// 创建单例实例
const sensitiveWordFilter = new SensitiveWordFilter();

export default sensitiveWordFilter;
