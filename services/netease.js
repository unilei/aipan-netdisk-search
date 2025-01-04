import { t2s } from 'chinese-s2t'

class NetEaseService {
  constructor() {
    this.BASE_URL = 'https://netease-cloud-music-api-psi-silk.vercel.app'
  }

  // 繁体转简体函数
  toSimplified(text) {
    if (!text) return text
    return t2s(text)
  }

  // 获取歌词
  async getLyric(id) {
    try {
      const response = await fetch(`${this.BASE_URL}/lyric?id=${id}`)
      const data = await response.json()
      
      if (!data.lrc?.lyric) {
        return ''
      }

      // 处理歌词文本，移除时间戳和特殊内容
      const lyrics = data.lrc.lyric
        .split('\n')
        .map(line => {
          // 移除时间标记 [00:00.000]
          let content = line.replace(/\[\d{2}:\d{2}\.\d{3}\]/g, '').trim()
          
          // 移除作词、作曲等信息行
          if (content.match(/^作词|^作曲|^编曲|^制作|^作品|^歌词|^歌手|^演唱|^编辑|^制作|^录音|^混音|^录制|^发行|^出品|^监制|^策划|^统筹|^企划|^发行|^出版|^版权|^词曲/)) {
            return ''
          }
          
          // 移除括号内的翻译歌词
          content = content.replace(/\(.*?\)/g, '')
          content = content.replace(/（.*?）/g, '')
          
          // 移除方括号内的翻译歌词
          content = content.replace(/\[.*?\]/g, '')
          content = content.replace(/【.*?】/g, '')
          
          return content.trim()
        })
        .filter(line => line && !line.match(/^\s*$/)) // 移除空行和纯空格行
        .join('\n')

      return this.toSimplified(lyrics)
    } catch (error) {
      console.error('Error fetching lyrics:', error)
      return ''
    }
  }

  async searchTracks(query) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/search?keywords=${encodeURIComponent(this.toSimplified(query))}&limit=20&type=1`
      )
      const data = await response.json()
      
      if (!data.result?.songs) {
        return []
      }

      // 获取所有歌曲的详细信息
      const songIds = data.result.songs.map(song => song.id)
      const detailResponse = await fetch(`${this.BASE_URL}/song/detail?ids=${songIds.join(',')}`)
      const detailData = await detailResponse.json()

      if (!detailData.songs) {
        return []
      }

      // 获取每首歌的歌词
      const tracks = await Promise.all(
        detailData.songs.map(async track => {
          const lyrics = await this.getLyric(track.id)
          return {
            id: track.id,
            name: track.name,
            artist: track.ar.map(artist => artist.name).join(', '),
            albumArt: track.al.picUrl ? `${track.al.picUrl}?param=500y500` : null,
            album: track.al.name,
            lyrics
          }
        })
      )

      return tracks
    } catch (error) {
      console.error('Error searching tracks:', error)
      return []
    }
  }

  async getTrackDetail(id) {
    try {
      const response = await fetch(`${this.BASE_URL}/song/detail?ids=${id}`)
      const data = await response.json()
      
      if (!data.songs?.[0]) {
        return null
      }

      const track = data.songs[0]
      const lyrics = await this.getLyric(track.id)

      return {
        id: track.id,
        name: track.name,
        artist: track.ar.map(artist => artist.name).join(', '),
        albumArt: track.al.picUrl ? `${track.al.picUrl}?param=500y500` : null,
        album: track.al.name,
        lyrics
      }
    } catch (error) {
      console.error('Error getting track detail:', error)
      return null
    }
  }
}

export default new NetEaseService() 