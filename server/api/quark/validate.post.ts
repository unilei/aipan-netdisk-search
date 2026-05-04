import { ofetch } from 'ofetch';
import { getHeader, setResponseStatus } from 'h3';
import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/model/user";
import { buildTransferFingerprintFromShareDetail } from "~/server/services/points/pointsLedger.mjs";
import { grantTransferPointsForShare } from "~/server/services/points/userPoints";
import {
    QUARK_VERIFICATION_PURPOSES,
    normalizeQuarkConfig,
    normalizeQuarkVerificationPurpose,
    resolveQuarkVerificationTarget
} from "~/server/services/quark/quarkConfig.mjs";

const SHARE_TOKEN_URL = 'https://drive-h.quark.cn/1/clouddrive/share/sharepage/token';
const SHARE_DETAIL_URL = 'https://drive-h.quark.cn/1/clouddrive/share/sharepage/detail';
 
const createCommonParams = () => ({
    pr: 'ucpro',
    fr: 'pc',
    uc_param_str: '',
    __dt: 266,
    __t: Date.now()
});

const extractShareId = (shareLink: string): string | null => {
    if (!shareLink || typeof shareLink !== 'string') {
        return null;
    }
    const normalized = shareLink.trim();
    const match = normalized.match(/pan\.quark\.cn\/s\/([a-zA-Z0-9]+)/i);
    return match && match[1] ? match[1] : null;
};

type ShareDetail = Record<string, any> | null;

const getOptionalUserId = (event: any): number | null => {
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    try {
        const decoded = verifyToken(token);
        return decoded?.userId ? Number(decoded.userId) : null;
    } catch (error) {
        console.warn('夸克转存验证携带了无效登录态，按游客验证处理');
        return null;
    }
};

const getShareToken = async (shareId: string): Promise<string> => {
    const query = createCommonParams();

    const response = await ofetch(SHARE_TOKEN_URL, {
        method: 'POST',
        query,
        body: {
            share_id: shareId,
            pwd_id: shareId,
            passcode: '',
            support_visit_limit_private_share: true
        },
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const stoken = response?.data?.stoken || response?.stoken;

    if (!stoken) {
        const error = new Error(response?.msg || 'TOKEN_ERROR');
        error.name = 'QUARK_TOKEN_ERROR';
        throw error;
    }
 
    return stoken;
};

const fetchShareDetail = async (shareLink: string): Promise<ShareDetail> => {
    const shareId = extractShareId(shareLink);
    if (!shareId) {
        throw new Error('INVALID_SHARE_LINK');
    }

    const stoken = await getShareToken(shareId);

    const response = await ofetch(SHARE_DETAIL_URL, {
        method: 'GET',
        query: {
            pr: 'ucpro',
            fr: 'pc',
            uc_param_str: '',
            ver: 2,
            pwd_id: shareId,
            stoken: stoken
        },
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response as ShareDetail;
};

// 比较两个分享的内容是否一致
const compareShareContent = (configDetail: ShareDetail, userDetail: ShareDetail): boolean => {
    if (!configDetail || !userDetail) {
        return false;
    }

    // 获取文件列表数据
    const configFiles = configDetail?.data?.list || [];
    const userFiles = userDetail?.data?.list || [];

    // 如果文件数量不同，则内容不匹配
    if (configFiles.length !== userFiles.length) {
        return false;
    }

    // 如果没有文件，认为匹配
    if (configFiles.length === 0) {
        return true;
    }

    // 创建文件映射，用于比较
    const createFileMap = (files: any[]) => {
        return files.reduce((map, file) => {
            // 使用文件名和大小作为唯一标识
            const key = `${file.file_name}_${file.size || 0}`;
            map[key] = file;
            return map;
        }, {});
    };

    const configFileMap = createFileMap(configFiles);
    const userFileMap = createFileMap(userFiles);

    // 检查每个配置文件是否在用户文件中存在
    for (const key of Object.keys(configFileMap)) {
        if (!userFileMap[key]) {
            return false;
        }
    }

    return true;
};

export default defineEventHandler(async (event) => {
    if (event.method !== 'POST') {
        setResponseStatus(event, 405);
        return {
            code: 405,
            msg: 'Method Not Allowed'
        };
    }

    try {
        const body = await readBody<{
            shareLink?: string;
            purpose?: string;
        }>(event);

        const submittedLink = body?.shareLink?.trim();
        const purpose = normalizeQuarkVerificationPurpose(body?.purpose);

        if (!submittedLink) {
            return {
                code: 400,
                msg: '请输入有效的夸克转存链接'
            };
        }

        const settings = await prisma.systemSettings.findFirst({
            where: {
                key: 'quark_config'
            }
        });

        if (!settings) {
            return {
                code: 400,
                msg: '转存配置未设置'
            };
        }

        const config = normalizeQuarkConfig(JSON.parse(settings.value || '{}'));
        const target = resolveQuarkVerificationTarget(config, purpose);

        if (!target.enabled || !target.shareLink) {
            return {
                code: 400,
                msg: target.missingReason || '转存验证尚未启用'
            };
        }

        const userId = getOptionalUserId(event);
        if (purpose === QUARK_VERIFICATION_PURPOSES.points && !userId) {
            return {
                code: 401,
                msg: '请先登录后领取积分'
            };
        }

        // 1. 检查用户输入的链接不能和配置的链接一样
        if (submittedLink === target.shareLink) {
            return {
                code: 400,
                msg: '不能使用原始分享链接进行验证，请使用您转存后的分享链接'
            };
        }

        // 提取分享ID进行比较，防止URL格式不同但实际是同一个分享
        const configShareId = extractShareId(target.shareLink);
        const userShareId = extractShareId(submittedLink);
        
        if (configShareId && userShareId && configShareId === userShareId) {
            return {
                code: 400,
                msg: '不能使用原始分享链接进行验证，请使用您转存后的分享链接'
            };
        }

        const [configuredDetail, userDetail] = await Promise.all([
            fetchShareDetail(target.shareLink),
            fetchShareDetail(submittedLink)
        ]);

      
        // 2. 检测返回的结果是否一样（比较分享内容）
        if (!configuredDetail || !userDetail) {
            return {
                code: 400,
                msg: '无法获取分享详情，请检查链接是否有效'
            };
        }

        // 比较分享的文件列表是否一致
        const isContentMatched = compareShareContent(configuredDetail, userDetail);
        
        if (!isContentMatched) {
            return {
                code: 400,
                msg: '分享内容不匹配，请确保转存了完整的文件内容'
            };
        }

        const transferFingerprint = purpose === QUARK_VERIFICATION_PURPOSES.points
            ? buildTransferFingerprintFromShareDetail(userDetail)
            : null;

        if (purpose === QUARK_VERIFICATION_PURPOSES.points && !transferFingerprint) {
            return {
                code: 400,
                msg: '无法识别转存内容，请确认分享链接内包含已转存的文件'
            };
        }

        const reward = purpose === QUARK_VERIFICATION_PURPOSES.points && userId && userShareId
            ? await grantTransferPointsForShare({
                userId,
                shareId: userShareId,
                transferFingerprint,
                config
            })
            : null;

        return {
            code: 200,
            msg: '验证成功',
            data: {
                purpose,
                reward
            },
            purpose,
            reward
        };
    } catch (error: any) {
        if (error?.message === 'INVALID_SHARE_LINK') {
            return {
                code: 400,
                msg: '分享链接格式不正确'
            };
        }

        if (error?.name === 'QUARK_TOKEN_ERROR') {
            return {
                code: 502,
                msg: `夸克接口 Token 获取失败：${error.message}`
            };
        }

        if (error?.name === 'QUARK_REMOTE_ERROR') {
            return {
                code: 502,
                msg: `夸克接口返回错误：${error.message}`
            };
        }

        if (error?.status === 429) {
            return {
                code: 429,
                msg: '夸克接口请求过于频繁，请稍后重试'
            };
        }

        console.error('校验夸克分享链接失败:', error);
        return {
            code: 500,
            msg: '验证失败，请稍后重试'
        };
    }
});
