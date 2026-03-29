import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";

type UploadFolder = "user-photos" | "user-documents" | "asset-photos" | "asset-invoices";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const folderRules: Record<
  UploadFolder,
  { directory: string; acceptedMimePrefixes: string[]; acceptedExtensions: string[] }
> = {
  "user-photos": {
    directory: "user-photos",
    acceptedMimePrefixes: ["image/"],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  "asset-photos": {
    directory: "asset-photos",
    acceptedMimePrefixes: ["image/"],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  "user-documents": {
    directory: "user-documents",
    acceptedMimePrefixes: [
      "application/pdf",
      "image/",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    acceptedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"],
  },
  "asset-invoices": {
    directory: "asset-invoices",
    acceptedMimePrefixes: [
      "application/pdf",
      "image/",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/csv",
      "text/plain",
    ],
    acceptedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".xls", ".xlsx", ".csv"],
  },
};

function getFileExtension(fileName: string): string {
  const parsed = path.parse(fileName);
  return parsed.ext.toLowerCase();
}

function isAllowedMimeType(fileType: string, acceptedPrefixes: string[]): boolean {
  if (!fileType) {
    return false;
  }

  return acceptedPrefixes.some((prefix) => fileType.startsWith(prefix));
}

function hasPdfSignature(fileBuffer: Buffer): boolean {
  return fileBuffer.length >= 5 && fileBuffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function hasPngSignature(fileBuffer: Buffer): boolean {
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return pngHeader.every((value, index) => fileBuffer[index] === value);
}

function hasJpegSignature(fileBuffer: Buffer): boolean {
  return fileBuffer.length >= 3 && fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff;
}

function hasWebpSignature(fileBuffer: Buffer): boolean {
  return (
    fileBuffer.length >= 12 &&
    fileBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    fileBuffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function hasExpectedBinarySignature(fileBuffer: Buffer, extension: string): boolean {
  switch (extension) {
    case ".pdf":
      return hasPdfSignature(fileBuffer);
    case ".png":
      return hasPngSignature(fileBuffer);
    case ".jpg":
    case ".jpeg":
      return hasJpegSignature(fileBuffer);
    case ".webp":
      return hasWebpSignature(fileBuffer);
    default:
      return true;
  }
}

export async function POST(request: Request) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderValue = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibio un archivo valido" }, { status: 400 });
    }

    if (typeof folderValue !== "string" || !(folderValue in folderRules)) {
      return NextResponse.json({ error: "Destino de carga no valido" }, { status: 400 });
    }

    const folder = folderValue as UploadFolder;
    const rule = folderRules[folder];
    const extension = getFileExtension(file.name);

    if (file.size <= 0) {
      return NextResponse.json({ error: "El archivo esta vacio" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo supera el limite de 10MB" },
        { status: 413 }
      );
    }

    if (
      !rule.acceptedExtensions.includes(extension) ||
      !isAllowedMimeType(file.type, rule.acceptedMimePrefixes)
    ) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido para este destino" },
        { status: 415 }
      );
    }

    const dayFolder = new Date().toISOString().slice(0, 10);
    const targetDir = path.join(process.cwd(), "public", "uploads", rule.directory, dayFolder);
    await mkdir(targetDir, { recursive: true });

    const generatedName = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
    const targetPath = path.join(targetDir, generatedName);

    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    if (!hasExpectedBinarySignature(fileBuffer, extension)) {
      return NextResponse.json(
        { error: "El archivo no coincide con su extension declarada" },
        { status: 415 }
      );
    }

    await writeFile(targetPath, fileBuffer);

    const fileUrl = `/uploads/${rule.directory}/${dayFolder}/${generatedName}`;

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "UPLOAD",
      entity: "file_upload",
      entityId: generatedName,
      description: `Archivo subido en carpeta ${folder}`,
      newValue: {
        folder,
        originalName: file.name,
        generatedName,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl,
      },
    });

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "No fue posible subir el archivo" },
      { status: 500 }
    );
  }
}
