export type UploadFolder =
  | "user-photos"
  | "user-documents"
  | "asset-photos"
  | "asset-invoices";

export interface UploadedFileResult {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export async function uploadFileToServer(
  file: File,
  folder: UploadFolder
): Promise<UploadedFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body) {
    throw new Error(body?.error || "No fue posible subir el archivo");
  }

  return {
    fileUrl: body.fileUrl,
    fileName: body.fileName,
    mimeType: body.mimeType,
    fileSize: body.fileSize,
  };
}
