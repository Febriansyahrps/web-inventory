// lib/upload.ts — shared photo handling for add/update-product.
// Photos are stored in Cloudflare R2 (S3-compatible); the DB keeps the public URL.
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import crypto from "crypto";

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const OBJECT_PREFIX = "barang";

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

function bucketName(): string {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error("S3_BUCKET is not set");
  return name;
}

function publicBaseUrl(): string {
  const url = process.env.S3_PUBLIC_BASE_URL;
  if (!url) throw new Error("S3_PUBLIC_BASE_URL is not set");
  return url.replace(/\/$/, "");
}

export async function savePhoto(file: File): Promise<string> {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new Error("foto harus berupa gambar JPEG, PNG, atau WebP");

  const key = `${OBJECT_PREFIX}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );

  return `${publicBaseUrl()}/${key}`;
}

export async function deletePhoto(publicPath: string | null): Promise<void> {
  if (!publicPath) return;

  const base = publicBaseUrl();
  const key = publicPath.startsWith(base)
    ? publicPath.slice(base.length + 1)
    : publicPath.replace(/^\/uploads\//, "");

  await s3.send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
}
