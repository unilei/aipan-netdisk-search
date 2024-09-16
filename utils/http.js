import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

import UserAgent from "user-agents";

const http = axios.create({
  proxy: false,
});

http.interceptors.request.use(
  async (config) => {
    if (!config.noProxy) {
      const proxyIp = await getProxyIp();
      const userAgent = new UserAgent();
      config.httpsAgent = new HttpsProxyAgent(`http://${proxyIp}`);
      config.headers["User-Agent"] = userAgent.toString();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

async function getProxyIp() {
  const urls = [
    "http://demo.spiderpy.cn/get/",
    "https://proxypool.aipan.me/get/",
  ];
  // Randomly select one URL
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];

  try {
    const res = await http.get(randomUrl, { noProxy: true });
    return res.proxy; // 确保这里的 res.proxy 是有效的
  } catch (error) {
    console.error("Error fetching proxy IP:", error);
    throw error; // 重新抛出错误以便上层捕获
  }
}

export default http;
