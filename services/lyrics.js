class LyricsService {
  constructor() {
    this.BASE_URL = 'https://netease.aipan.me'
  }

  async getLyrics(track) {
    try {
      if (!track?.id) {
        console.error('Missing track ID')
        return ''
      }

      // 直接使用track中的歌词
      return track.lyrics || ''
      
    } catch (error) {
      console.error('Error fetching lyrics:', error)
      return ''
    }
  }

  formatLyrics(lyrics) {
    if (!lyrics) return ''
    
    // 清理歌词文本并转换为简体
    return lyrics
      .split("\n")
      .map((line) => {
        let content = line.trim();

        // 移除括号内的翻译歌词
        content = content.replace(/\(.*?\)/g, "");
        content = content.replace(/（.*?）/g, "");

        // 移除方括号内的翻译歌词
        content = content.replace(/\[.*?\]/g, "");
        content = content.replace(/【.*?】/g, "");

        return content.trim();
      })
      .filter((line) => {
        // 移除空行和纯空格行
        if (!line || line.match(/^\s*$/)) return false;

        // 移除作词、作曲等信息行
        if (
          line.match(
            /^作词|^作曲|^编曲|^制作|^作品|^歌词|^歌手|^演唱|^编辑|^制作|^录音|^混音|^录制|^发行|^出品|^监制|^策划|^统筹|^企划|^发行|^出版|^版权|^词曲/
          )
        ) {
          return false;
        }

        return true;
      })
      .join("\n");
  }

  getPreviewLyrics(lyrics, maxLength = 150, fullMode = false) {
    if (!lyrics) return ''
    
    // 获取歌词的所有行，并确保每行都是简体
    const lines = lyrics.split("\n").filter((line) => line.trim());
    
    // 如果是完整模式，返回所有歌词
    if (fullMode) {
      // 将歌词分成每页26行
      const pages = []
      const linesPerPage = 26
      
      for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push(lines.slice(i, i + linesPerPage).join('\n'))
      }
      
      // 如果只有一页，直接返回字符串
      if (pages.length === 1) {
        return pages[0]
      }
      
      return pages
    }
    
    // 预览模式：只返回前几行
    let preview = ''
    let count = 0
    
    for (const line of lines) {
      if (count >= 4 || (preview + line).length > maxLength) break // 最多显示4行
      preview += line + '\n'
      count++
    }
    
    return preview.trim()
  }

  getRandomLyricsSnippet(lyrics, lineCount = 8, fullMode = false) {
    if (!lyrics) return ''
    
    // 获取歌词的所有行，并确保每行都是简体
    const lines = lyrics.split("\n").filter((line) => line.trim());
    
    // 如果是完整模式，返回所有歌词
    if (fullMode) {
      return lines.join('\n')
    }

    // 预览模式：返回随机片段
    const startIndex = Math.floor(Math.random() * (lines.length - lineCount))
    return lines.slice(startIndex, startIndex + lineCount).join('\n')
  }
}

export default new LyricsService() 