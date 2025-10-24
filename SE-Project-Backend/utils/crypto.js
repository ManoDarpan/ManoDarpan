import crypto from "crypto";

const MASTER_KEY = Buffer.from(process.env.MASTER_KEY, "base64");

export const randomBytes = (n = 32) => crypto.randomBytes(n);

export const aesGcmEncrypt = (plaintextBuffer, keyBuffer) => {
	const iv = crypto.randomBytes(12); // 96-bit recommended
	const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
	const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
	const tag = cipher.getAuthTag();
	return {
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		ciphertext: ciphertext.toString("base64")
	};
};

export const aesGcmDecrypt = ({ iv, tag, ciphertext }, keyBuffer) => {
	const ivBuf = Buffer.from(iv, "base64");
	const tagBuf = Buffer.from(tag, "base64");
	const ctBuf = Buffer.from(ciphertext, "base64");
	const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, ivBuf);
	decipher.setAuthTag(tagBuf);
	const decrypted = Buffer.concat([decipher.update(ctBuf), decipher.final()]);
	return decrypted;
};

export const wrapConversationKey = (conversationKeyBuffer) => {
	return aesGcmEncrypt(conversationKeyBuffer, MASTER_KEY);
};

export const unwrapConversationKey = (wrappedObj) => {
	return aesGcmDecrypt(wrappedObj, MASTER_KEY);
};
