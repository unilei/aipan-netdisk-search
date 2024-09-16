import crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

export function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString("hex"),
    key: key.toString("hex"),
    encryptedData: encrypted.toString("hex"),
  };
}

export function decrypt(encryptedData) {
  let iv = Buffer.from(encryptedData.iv, "hex");
  let key = Buffer.from(encryptedData.key, "hex");
  let encryptedText = Buffer.from(encryptedData.encryptedData, "hex");
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export const formatCloudDriveName = (url) => {
  let service = "";
  if (url.includes("pan.baidu.com")) {
    service = "BAIDU";
  } else if (url.includes("pan.xunlei.com")) {
    service = "XUNLEI";
  } else if (url.includes("pan.quark.cn")) {
    service = "QUARK";
  } else if (url.includes("www.aliyundrive.com")) {
    service = "ALIYUN";
  } else {
    service = "OTHER";
  }
  return service;
};
