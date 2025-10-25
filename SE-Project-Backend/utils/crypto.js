import crypto from "crypto"; // Node.js built-in module for cryptographic functions

const MASTER_KEY = Buffer.from(process.env.MASTER_KEY, "base64"); // Load and decode the application-wide master encryption key

export const randomBytes = (n = 32) => crypto.randomBytes(n); // Generate secure random bytes (e.g., for keys or IVs)

export const aesGcmEncrypt = (plaintextBuffer, keyBuffer) => {
	const iv = crypto.randomBytes(12); // Generate a unique Initialization Vector (IV) for security
	const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv); // Create AES-256-GCM cipher instance
	const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]); // Encrypt the data
	const tag = cipher.getAuthTag(); // Get the authentication tag for integrity
	return {
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		ciphertext: ciphertext.toString("base64")
	};
};

export const aesGcmDecrypt = ({ iv, tag, ciphertext }, keyBuffer) => {
	const ivBuf = Buffer.from(iv, "base64"); // Convert IV back to Buffer
	const tagBuf = Buffer.from(tag, "base64"); // Convert Tag back to Buffer
	const ctBuf = Buffer.from(ciphertext, "base64"); // Convert Ciphertext back to Buffer
	const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, ivBuf); // Create AES-256-GCM decipher instance
	decipher.setAuthTag(tagBuf); // Set the authentication tag for verification
	const decrypted = Buffer.concat([decipher.update(ctBuf), decipher.final()]); // Decrypt the data (throws if tag is invalid)
	return decrypted;
};

export const wrapConversationKey = (conversationKeyBuffer) => {
	// Encrypts the conversation's symmetric key using the application's master key
	return aesGcmEncrypt(conversationKeyBuffer, MASTER_KEY);
};

export const unwrapConversationKey = (wrappedObj) => {
	// Decrypts the wrapped key using the application's master key
	return aesGcmDecrypt(wrappedObj, MASTER_KEY);
};
