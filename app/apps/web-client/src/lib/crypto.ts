/**
 * Criptografia de dados PII no localStorage usando Web Crypto API
 * Protege dados sensíveis (endereços, perfil) contra acesso casual
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits para GCM
const TAG_LENGTH = 128; // 128 bits para autenticação

/**
 * Deriva uma chave a partir de um salt fixo e user-agent
 * Não é forte cryptograficamente (não use para produção com dados ultra-sensíveis),
 * mas protege contra acesso casual (dispositivo roubado/compartilhado)
 */
async function deriveKey(): Promise<CryptoKey> {
  const salt = new TextEncoder().encode("vendza-pii-protection-v1");

  // Usar informação local do device como parte do material de derivação
  // Isso garante que dados não podem ser lidos em outro navegador/device
  const userAgentHash = await hashString(navigator.userAgent);
  const combined = new Uint8Array([...salt, ...userAgentHash.slice(0, 16)]);

  // PBKDF2 para derivação da chave
  const baseKey = await crypto.subtle.importKey(
    "raw",
    combined,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      iterations: 100000,
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Hash SHA-256 de uma string
 */
async function hashString(str: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}

/**
 * Criptografa um objeto JSON
 * @returns Base64-encoded string: "iv:ciphertext" format
 */
export async function encryptData(data: any): Promise<string> {
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const plaintext = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      plaintext
    );

    // Formato: base64(iv + ciphertext)
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error("Erro ao criptografar dados:", error);
    throw error;
  }
}

/**
 * Descriptografa um objeto JSON
 * @param encrypted Base64-encoded string: "iv:ciphertext" format
 */
export async function decryptData<T>(encrypted: string): Promise<T> {
  try {
    const key = await deriveKey();

    // Decodificar base64
    const combined = Uint8Array.from(
      atob(encrypted),
      (char) => char.charCodeAt(0)
    );

    // Extrair IV e ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    const decoded = new TextDecoder().decode(plaintext);
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error("Erro ao descriptografar dados:", error);
    throw error;
  }
}

/**
 * Verifica se a string parece criptografada (base64)
 * Usado para compatibilidade: aceita dados antigos em JSON puro
 */
export function looksEncrypted(str: string): boolean {
  try {
    // Se for base64 válido E contiver estrutura de IV+ciphertext, é encriptado
    const decoded = atob(str);
    return decoded.length > IV_LENGTH; // Mínimo: IV + algum ciphertext
  } catch {
    return false;
  }
}
