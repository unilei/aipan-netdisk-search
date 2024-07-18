export const formatCloudDriveName = (url) => {
    let service = '';
    if (url.includes('pan.baidu.com')) {
        service = 'BAIDU';
    } else if (url.includes('pan.xunlei.com')) {
        service = 'XUNLEI';
    } else if (url.includes('pan.quark.cn')) {
        service = 'QUARK';
    } else if (url.includes('www.aliyundrive.com')) {
        service = 'ALIYUN'
    } else {
        service = 'OTHER';
    }
    return service
};