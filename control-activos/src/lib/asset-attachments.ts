const FACTURA_PREFIX = "[FACTURA] ";
const INVOICE_FILE_PATTERN = /\.(pdf|doc|docx|xls|xlsx|csv)$/i;

export type AssetAttachmentKind = "PHOTO" | "INVOICE";

export function getAssetAttachmentKind(
  caption: string | null | undefined,
  url: string
): AssetAttachmentKind {
  if ((caption && caption.startsWith(FACTURA_PREFIX)) || INVOICE_FILE_PATTERN.test(url)) {
    return "INVOICE";
  }

  return "PHOTO";
}

export function createAssetAttachmentCaption(
  kind: AssetAttachmentKind,
  fileName: string,
  caption?: string | null
): string {
  const normalizedCaption = caption?.trim();

  if (kind === "INVOICE") {
    if (normalizedCaption?.startsWith(FACTURA_PREFIX)) {
      return normalizedCaption;
    }

    return `${FACTURA_PREFIX}${normalizedCaption || fileName}`;
  }

  return normalizedCaption || fileName;
}

export function getAssetAttachmentLabel(
  caption: string | null | undefined,
  fallbackName: string
): string {
  if (!caption) {
    return fallbackName;
  }

  if (caption.startsWith(FACTURA_PREFIX)) {
    return caption.slice(FACTURA_PREFIX.length).trim() || fallbackName;
  }

  return caption;
}
