export default class ByteIf {
  public static b64toBytes(base64Str: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(atob(base64Str), (c) => c.charCodeAt(0));
  }
}
