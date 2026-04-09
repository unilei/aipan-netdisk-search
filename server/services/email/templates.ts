export const getEmailVerificationTemplate = ({
  userName,
  verificationLink,
  expireMinutes,
}: {
  userName?: string | null;
  verificationLink: string;
  expireMinutes: number;
}) => {
  const displayName = userName?.trim() || "用户";

  return {
    subject: "请验证你的邮箱地址",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 16px;">邮箱验证</h2>
        <p>${displayName}，你好：</p>
        <p>请点击下面的按钮完成邮箱验证。</p>
        <p style="margin:24px 0;">
          <a href="${verificationLink}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;">验证邮箱</a>
        </p>
        <p>如果按钮无法点击，请复制下面的链接到浏览器打开：</p>
        <p style="word-break:break-all;color:#2563eb;">${verificationLink}</p>
        <p>该链接将在 ${expireMinutes} 分钟后失效。</p>
        <p>如果这不是你的操作，请忽略这封邮件。</p>
      </div>
    `,
    text: [
      `${displayName}，你好：`,
      "",
      "请使用下面的链接完成邮箱验证：",
      verificationLink,
      "",
      `该链接将在 ${expireMinutes} 分钟后失效。`,
      "如果这不是你的操作，请忽略这封邮件。",
    ].join("\n"),
  };
};
