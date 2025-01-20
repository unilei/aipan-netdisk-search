import { defineStore } from 'pinia';
import Hls from 'hls.js';

interface RadioState {
  currentStation: any | null;
  isPlaying: boolean;
  audio: HTMLAudioElement | null;
  hls: Hls | null;
  volume: number;
  isMuted: boolean;
  previousVolume: number;
  isLoading: boolean;
  isBuffering: boolean;
  errorMessage: string;
}

export const useRadioStore = defineStore('radio', {
  state: (): RadioState => ({
    currentStation: null,
    isPlaying: false,
    audio: null,
    hls: null,
    volume: 0.5,
    isMuted: false,
    previousVolume: 0.5,
    isLoading: false,
    isBuffering: false,
    errorMessage: ''
  }),

  actions: {
    initAudio(): void {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.volume = this.volume;

          this.audio.onerror = () => {
            // 只在非主动停止的情况下显示错误信息
            if (this.isPlaying) {
              this.errorMessage = '音频加载失败，请稍后重试';
              this.stopStation();
            }
          };

        this.audio.onwaiting = () => {
          this.isBuffering = true;
        };

        this.audio.onplaying = () => {
          this.isBuffering = false;
          this.errorMessage = '';
        };
      }
    },

    initHls(url: string): void {
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }

      if (Hls.isSupported()) {
        this.hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
        });
        if (this.audio) {
          this.hls.attachMedia(this.audio);
        }
        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (this.hls) {
            this.hls.loadSource(url);
          }
        });
        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                this.errorMessage = '网络错误，正在尝试重连...';
                if (this.hls) {
                  this.hls.startLoad();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                this.errorMessage = '媒体错误，正在尝试恢复...';
                if (this.hls) {
                  this.hls.recoverMediaError();
                }
                break;
              default:
                this.errorMessage = '播放错误，请稍后重试';
                this.stopStation();
                break;
            }
          }
        });
      } else if (this.audio?.canPlayType('application/vnd.apple.mpegurl')) {
        this.audio.src = url;
      } else {
        this.errorMessage = '您的浏览器不支持 HLS 播放';
      }
    },

    async playStation(station: any): Promise<void> {
      try {
        this.isLoading = true;
        this.errorMessage = '';
        
        if (this.currentStation) {
          this.currentStation.isPlaying = false;
          // 确保 audio 对象存在再调用 pause 方法
          if (this.audio) {
            this.audio.pause();
          }
          if (this.hls) {
            this.hls.destroy();
            this.hls = null;
          }
        }
        
        this.currentStation = station;
        station.isPlaying = true;
        this.isPlaying = true;
        
        // 检查 station.url 是否存在
        if (station?.url) {
          if (station.url.includes('.m3u8')) {
            this.initHls(station.url);
          } else if (this.audio) {
            this.audio.src = station.url;
          }
        } else {
          this.errorMessage = 'URL不存在';
          this.stopStation();
        }
        
        if (this.audio) {
          await this.audio.play();
        }
      } catch (error) {
        console.error('播放失败:', error);
        this.errorMessage = '播放失败，请稍后重试';
        this.stopStation();
      } finally {
        this.isLoading = false;
      }
    },

    stopStation() {
      if (this.currentStation) {
        this.currentStation.isPlaying = false;
        this.currentStation = null;
        this.isPlaying = false;
        this.errorMessage = ''; // 清除错误消息

        if (this.hls) {
          this.hls.destroy();
          this.hls = null;
        }

        // 先移除错误事件监听，避免触发不必要的错误
        if (this.audio) {
          const originalOnError = this.audio.onerror;
          this.audio.onerror = null;
          this.audio.pause();
          this.audio.src = '';
          // 恢复错误事件监听
          this.audio.onerror = originalOnError;
        }
      }
    },

    toggleMute(): void {
      if (!this.audio) return;
      
      if (this.isMuted) {
        this.audio.volume = this.previousVolume;
        this.volume = this.previousVolume;
      } else {
        this.previousVolume = this.volume;
        this.audio.volume = 0;
        this.volume = 0;
      }
      this.isMuted = !this.isMuted;
    },

    updateVolume(newVolume: number): void {
      this.volume = Math.max(0, Math.min(1, newVolume));
      if (this.audio) {
        this.audio.volume = this.volume;
      }
      if (this.volume > 0) {
        this.isMuted = false;
      }
    },

    cleanup(): void {
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }
    }
  }
});