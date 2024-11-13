export class EncryptionService {
  private static async getKey(): Promise<CryptoKey> {
    const rawKey = atob(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "");
    const keyData = new Uint8Array(
      [...rawKey].map((char) => char.charCodeAt(0))
    );
    return await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(data: string): Promise<string> {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoder.encode(data)
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedData: string): Promise<string> {
    const key = await this.getKey();
    const decoder = new TextDecoder();

    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    return decoder.decode(decryptedData);
  }
}

export class SecureStorageService {
  static async setItem(key: string, value: string): Promise<void> {
    const encryptedValue = await EncryptionService.encrypt(value);
    sessionStorage.setItem(key, encryptedValue);
  }

  static async getItem(key: string): Promise<string | null> {
    const encryptedValue = sessionStorage.getItem(key);
    if (!encryptedValue) return null;
    try {
      return await EncryptionService.decrypt(encryptedValue);
    } catch (error) {
      console.error("Error decrypting data:", error);
      return null;
    }
  }

  static removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }
}
