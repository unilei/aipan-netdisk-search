import { sendEmailMessage } from "~/server/services/email/resend";

const isValidEmail = (value?: string) => {
  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user || user.role !== "admin") {
    return {
      code: 403,
      msg: "无权限访问",
    };
  }

  try {
    const body = await readBody(event);
    const toEmail = body?.toEmail?.trim();

    if (!isValidEmail(toEmail)) {
      return {
        code: 400,
        msg: "请输入有效的测试邮箱",
      };
    }

    await sendEmailMessage(
      {
        to: toEmail,
        subject: "Resend 邮件配置测试",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
            <h2 style="margin:0 0 16px;">测试邮件发送成功</h2>
            <p>这是一封用于验证 Resend 配置的测试邮件。</p>
            <p>如果你收到了这封邮件，说明后台邮箱配置已经生效。</p>
          </div>
        `,
        text: "这是一封用于验证 Resend 配置的测试邮件。如果你收到了这封邮件，说明后台邮箱配置已经生效。",
      },
      {
        ignoreEnabled: true,
      },
    );

    return {
      code: 200,
      msg: "测试邮件发送成功",
    };
  } catch (error: any) {
    console.error("发送测试邮件失败:", error);

    return {
      code: error.statusCode || 500,
      msg: error.statusMessage || error.message || "发送测试邮件失败",
    };
  }
});
