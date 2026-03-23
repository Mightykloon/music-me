import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET ?? "music-me";
const PUBLIC_URL = process.env.S3_PUBLIC_URL ?? "";

export type UploadCategory = "avatars" | "banners" | "backgrounds" | "posts" | "misc";

const MAX_SIZES: Record<UploadCategory, number> = {
  avatars: 5 * 1024 * 1024,
  banners: 10 * 1024 * 1024,
  backgrounds: 50 * 1024 * 1024,
  posts: 10 * 1024 * 1024,
  misc: 10 * 1024 * 1024,
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export function getAllowedTypes(category: UploadCategory): string[] {
  if (category === "backgrounds") {
    return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  }
  return ALLOWED_IMAGE_TYPES;
}

export async function createPresignedUploadUrl(
  category: UploadCategory,
  contentType: string,
  userId: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const allowed = getAllowedTypes(category);
  if (!allowed.includes(contentType)) {
    throw new Error(`File type ${contentType} not allowed for ${category}`);
  }

  const ext = contentType.split("/")[1] ?? "bin";
  const key = `${category}/${userId}/${nanoid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  const publicUrl = `${PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export function getMaxSize(category: UploadCategory): number {
  return MAX_SIZES[category];
}
