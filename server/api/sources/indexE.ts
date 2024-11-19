// interface Result {
//     data: Array<any>
// }

// interface Body {
//     name: string
// }

// interface Link {
//     service: string,
//     link: string
// }

// interface TransformedItem {
//     name: string,
//     links: Link[]
// }

// interface TransformedResult {
//     list: TransformedItem[]
// }

// interface Token {
//     data: string
// }

// export default defineEventHandler(async (event) => {

//     try {
//         const body: Body = await readBody(event);

//         // 获取 token
//         const formData = new FormData();
//         formData.append('action', 'get_token');
//         const token: Token = await $fetch('https://gitcafe.net/tool/alipaper/', {
//             method: 'POST',
//             body: formData
//         });

//         // 搜索数据
//         const aFormData = new FormData();
//         aFormData.append('keyword', body.name);
//         aFormData.append('action', 'search');
//         aFormData.append('from', 'web');
//         aFormData.append('token', token.data);

//         const result: Result = await $fetch('https://gitcafe.net/tool/alipaper/', {
//             method: 'POST',
//             body: aFormData
//         });

//         // 转换结果
//         const transformedList: TransformedItem[] = result.data.map(item => {
//             const service = 'ALIYUN';

//             return {
//                 name: item.alititle,
//                 links: [{
//                     pwd: null,
//                     link: 'https://www.aliyundrive.com/s/' + item.alikey,
//                     service
//                 }]
//             };
//         });

//         const transformedResult: TransformedResult = { list: transformedList };

//         return transformedResult;

//     } catch (e) {
//         console.error(e);
//         return {
//             code: 500,
//             msg: 'error',
//         };
//     }

// })