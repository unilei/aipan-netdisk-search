export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data?: T;
    error?: unknown;
}

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: Date;
    isVerified: boolean;
} 