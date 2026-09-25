declare module "pdf-parse" {
  import type { Buffer } from "node:buffer";

  export default function pdfParse(data: Buffer): Promise<{ text: string }>;
}