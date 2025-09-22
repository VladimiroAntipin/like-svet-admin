/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";

const IMAGE_DIR = path.join(process.cwd(), "public", "images");
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

const modelMap = {
  Billboard: {
    findMany: (filter: any) => prismadb.billboard.findMany(filter),
    update: (where: any, data: any) => prismadb.billboard.update({ where, data }),
    field: "imageUrl",
    isArray: false,
  },
  Review: {
    findMany: (filter: any) => prismadb.review.findMany(filter),
    update: (where: any, data: any) => prismadb.review.update({ where, data }),
    field: "imageUrl",
    isArray: false,
  },
  Category: {
    findMany: (filter: any) => prismadb.category.findMany(filter),
    update: (where: any, data: any) => prismadb.category.update({ where, data }),
    field: "imageUrl",
    isArray: false,
  },
  Product: {
    findMany: (filter: any) => prismadb.product.findMany({ ...filter, include: { images: true } }),
    update: () => {},
    field: "images",
    isArray: true,
  },
  Customer: {
    findMany: (filter: any) => prismadb.customer.findMany(filter),
    update: (where: any, data: any) => prismadb.customer.update({ where, data }),
    field: "profileImage",
    isArray: false,
  },
} as const;

type ModelKey = keyof typeof modelMap;

async function downloadAndSaveImage(recordId: string, imgUrl: string) {
  const buffer = Buffer.from(
    (await axios.get(imgUrl, { responseType: "arraybuffer" })).data,
    "binary"
  );
  const webpBuffer = await sharp(buffer)
    .resize({ width: 1200 })
    .webp({ quality: 100 })
    .toBuffer();

  const fileName = `${recordId}_${path.basename(imgUrl)}.webp`;
  const filePath = path.join(IMAGE_DIR, fileName);
  fs.writeFileSync(filePath, webpBuffer);

  return `/images/${fileName}`;
}

function fileExists(localUrl: string) {
  if (!localUrl) return false;
  const filePath = path.join(process.cwd(), "public", localUrl.replace("/images/", "images/"));
  return fs.existsSync(filePath);
}

export async function POST(req: Request, { params }: any) {
  try {
    const { storeId } = params;
    let totalDownloaded = 0;
    let deletedCount = 0;
    const result: any[] = [];
    const referencedFiles = new Set<string>();

    for (const modelKey of Object.keys(modelMap) as ModelKey[]) {
      const client = modelMap[modelKey];
      const records: any[] = await client.findMany({ where: { storeId } });

      for (const record of records) {
        if (modelKey === "Product") {
          const imgs = Array.isArray(record.images) ? record.images : [];
          const updatedImages: any[] = [];

          for (const img of imgs) {
            if (!img?.url) continue;

            try {
              let localUrl = img.localUrl;
              if (!localUrl || !fileExists(localUrl)) {
                localUrl = await downloadAndSaveImage(img.id, img.url);
                await prismadb.image.update({ where: { id: img.id }, data: { localUrl } });
                totalDownloaded++;
              }
              updatedImages.push({ ...img, localUrl });
              referencedFiles.add(localUrl);
            } catch (imgErr) {
              console.error(`[IMAGE_DOWNLOAD_ERROR] ImageId: ${img.id}, url: ${img.url}`, imgErr);
            }
          }

          result.push({ model: modelKey, id: record.id, images: updatedImages });
        } else {
          const imgUrl = record[client.field];
          if (!imgUrl) continue;

          let localUrl = record.localUrl;
          try {
            if (!localUrl || !fileExists(localUrl)) {
              localUrl = await downloadAndSaveImage(record.id, imgUrl);
              await client.update({ id: record.id }, { localUrl });
              totalDownloaded++;
            }
            referencedFiles.add(localUrl);
          } catch (imgErr) {
            console.error(`[IMAGE_DOWNLOAD_ERROR] recordId: ${record.id}, url: ${imgUrl}`, imgErr);
          }

          result.push({ model: modelKey, id: record.id, localUrl });
        }
      }
    }

    // --- PULIZIA FILE ORFANI ---
    const allFiles = fs.readdirSync(IMAGE_DIR);
    for (const file of allFiles) {
      const localPath = `/images/${file}`;
      if (!referencedFiles.has(localPath)) {
        try {
          fs.unlinkSync(path.join(IMAGE_DIR, file));
          deletedCount++;
          console.log(`[REMOVED_ORPHAN_IMAGE] ${file}`);
        } catch (err) {
          console.error(`[REMOVE_ERROR] ${file}`, err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      result, 
      countDownloaded: totalDownloaded,
      countDeleted: deletedCount
    });
  } catch (err: any) {
    console.error("[DOWNLOAD_IMAGES_UNIVERSAL]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}