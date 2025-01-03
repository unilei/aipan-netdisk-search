import { JwtPayload } from 'jsonwebtoken'

declare module 'jsonwebtoken' {
    export interface JwtPayload {
        userId: number;
        role: string;
        iat?: number;
        exp?: number;
    }
} 