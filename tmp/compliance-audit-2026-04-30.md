# AIPAN Content Compliance Audit

Generated: 2026-04-30T12:46:13.506Z

## Summary

- UserResource status: published 12691, pending 207, rejected 6
- Published adult or NSFW resource matches: 206
- Published explicit copyright-risk media resource matches: 10883
- Published gambling keyword resource matches: 3
- Published drugs, weapons, or violence keyword resource matches: 13
- Published cracked software keyword resource matches: 4
- Public blog posts with sensitive or piracy keywords: 3
- User VOD configs with adult sources: 2
- User VOD configs with third-party VOD or parser sources: 75
- Sensitive terms in current public search ranking top 100: all=0, day=0, week=0, month=0
- Report table summary: harassment resolved 1; no pending report rows found in this scan

Full item lists are in the JSON report. Dynamic resource links are omitted intentionally; use IDs in admin tooling.

## Static Findings

1. adult_nsfw_source: assets/vod/vod-config-nsfw.json:3-22 - Built-in NSFW VOD sources: 黄色仓库资源, 杏吧资源站, 大奶子资源网
2. unauthorized_vod_sources: assets/vod/vod-config.json:3-70 - Built-in third-party VOD collection and parsing sources
3. unauthorized_vod_sources: assets/vod/list.json:3-70 - Duplicate built-in third-party VOD collection and parsing sources
4. vip_video_parser: pages/freebox.vue:6-20, 161-167, 315-317 - Free VIP video parser UI and iframe playback through third-party parsing endpoints
5. free_drama_streaming: pages/drama/index.vue:12-13, 307, 527 - Public copy advertises free hot movie and drama streaming
6. music_download: pages/music/index.vue:8-10, 337-338 - Public copy advertises free FLAC/MP3 lossless music download
7. music_download: server/api/music/flac-download.ts:1-35 - Server proxies third-party FLAC download flow
8. tv_live: pages/tv/index.vue:3-5, 370 - Public copy advertises free online TV live streaming and custom live video playback
9. tv_live: server/api/tv/sources.get.ts:1-19 - Fetches remote TV channel source list
10. tvbox_source: pages/tvbox/index.vue:8-16 - Advertises free TVBox data sources
11. tvbox_source: server/api/tvbox/index.ts:3-23 - Scrapes third-party TVBox source list
12. cloud_resource_search: nuxt.config.ts:34, 51, 56, 68-72, 83-86 - SEO copy promotes cloud drive resource search and entertainment resource aggregation
13. cloud_resource_search: assets/vod/clouddrive.json:3-24 - Guest search enables multiple external cloud search source APIs
14. cloud_resource_search: assets/vod/clouddrive-login.json:3-27 - Logged-in search enables additional external cloud search source APIs
15. magnet_ed2k: server/services/search/source1Results.js:13-14 - Search result normalization recognizes magnet and ED2K links
16. magnet_ed2k: server/services/userResources/autoReview.js:16 - User resource auto-review treats MAGNET and ED2K as non-HTTP services
