import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

//if (typeof globalThis.Buffer === "undefined") {
globalThis.Buffer = Buffer;
// globalThis.Buffer.TYPED_ARRAY_SUPPORT = false;
//}
