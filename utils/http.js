import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

import UserAgent from 'user-agents';

const http = axios.create({
    proxy: false
});

http.interceptors.request.use(async (config) => {
    if (!config.noProxy) {
        const proxyIp = await getProxyIp();
        const userAgent = new UserAgent();
        config.httpsAgent = new HttpsProxyAgent(`http://${proxyIp}`);
        config.headers['User-Agent'] =  userAgent.toString();
    }
    return config;
}, (error) => Promise.reject(error));

http.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

async function getProxyIp() {
   const urls = [
        'http://demo.spiderpy.cn/get/?type=https',
        'http://demo.spiderpy.cn/get/',
        'https://proxypool.kkwnhub.com/get/'
    ];
       // Randomly select one URL
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    const res = await http.get(randomUrl, { noProxy: true });
    return res.proxy;
}

export default http;
