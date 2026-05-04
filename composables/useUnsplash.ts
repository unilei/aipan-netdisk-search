import { createApi } from 'unsplash-js';

// 创建 Unsplash API 实例
const unsplash = createApi({
    accessKey: '1HNUdBGFutQPBnM2Rz-KSHKHhaOEQyswrMHxM83KtUU'
});

export const useUnsplash = () => {
    // 缓存已获取的图片
    const photoCache = useState('unsplash-photo-cache', () => new Map());

    // 获取随机图片
    const getRandomPhoto = async (query: string = 'minimal,technology', count: number = 1) => {
        try {
            const result = await unsplash.photos.getRandom({
                query,
                count,
                orientation: 'landscape'
            });

            if (result.type === 'success') {
                const photos = Array.isArray(result.response) ? result.response : [result.response];
                return photos.map(photo => ({
                    id: photo.id,
                    url: photo.urls.regular,
                    thumb: photo.urls.small,
                    credit: {
                        name: photo.user.name,
                        link: photo.user.links.html
                    }
                }));
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch Unsplash photo:', error);
            return null;
        }
    };

    // 获取带缓存的图片
    const getCachedPhoto = async (postId: string) => {
        if (photoCache.value.has(postId)) {
            return photoCache.value.get(postId);
        }

        const photos = await getRandomPhoto();
        if (photos && photos.length > 0) {
            const photo = photos[0];
            photoCache.value.set(postId, photo);
            return photo;
        }

        return null;
    };

    return {
        getRandomPhoto,
        getCachedPhoto
    };
}; 