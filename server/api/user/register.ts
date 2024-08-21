import { registerUser, loginUser, findUserByEmail } from "~/server/model/user";

export default defineEventHandler(async (event) => {

    try {
        const { email, password } = await readBody(event);
        try {
            const userExists = await findUserByEmail(email);
            if (userExists) {
                // 用户已存在
                return await loginUser(email, password);
            } else {
                // 用户不存在
                return await registerUser();
            }
        } catch (error) {
            return error;
        }

    } catch (e) {
        console.log(e)
        return {
            code: 500,
            msg: 'error',
        }
    }
})