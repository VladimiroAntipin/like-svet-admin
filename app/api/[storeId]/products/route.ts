import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { userId } = await authServer({
      headers: {
        get: (name: string) => req.headers.get(name),
      },
    });

    const body = await req.json();
    const { name, description ,price, categoryId, sizeIds, colorIds, images, isFeatured, isArchived, isGiftCard, giftPrices } = body;

    if (!userId) return new NextResponse("Not authenticated", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!images || !images.length) return new NextResponse("Images are required", { status: 400 });
    if (!resolvedParams.storeId) return new NextResponse("Store ID is required", { status: 400 });
    if (!categoryId) return new NextResponse("Category ID is required", { status: 400 });
    if (!sizeIds || !Array.isArray(sizeIds) || !sizeIds.length) return new NextResponse("At least one size is required", { status: 400 });
    if (!colorIds || !Array.isArray(colorIds) || !colorIds.length) return new NextResponse("At least one color is required", { status: 400 });

    if (isGiftCard && (!giftPrices || !giftPrices.length)) {
      return new NextResponse("Gift prices are required", { status: 400 });
    }
    if (!isGiftCard && (price === undefined || price === null)) {
      return new NextResponse("Price is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });
    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const product = await prismadb.product.create({
      data: {
        name,
        description,
        price: isGiftCard ? null : price,
        isGiftCard: !!isGiftCard,
        isFeatured: !!isFeatured,
        isArchived: !!isArchived,
        categoryId,
        storeId: resolvedParams.storeId,
        images: { createMany: { data: images.map((img: { url: string }) => ({ url: img.url })) } },
        giftPrices: isGiftCard
          ? { createMany: { data: giftPrices.map((gp: { value: number }) => ({ value: gp.value })) } }
          : undefined,
      },
    });

    if (sizeIds && sizeIds.length) {
      await prismadb.productSize.createMany({
        data: sizeIds.map((sizeId: string) => ({ productId: product.id, sizeId })),
      });
    }

    if (colorIds && colorIds.length) {
      await prismadb.productColor.createMany({
        data: colorIds.map((colorId: string) => ({ productId: product.id, colorId })),
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ================= GET PRODUCTS LIST =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const isFeaturedParam = searchParams.get("isFeatured");
    const isFeatured = isFeaturedParam === "true" ? true : undefined;

    if (!resolvedParams.storeId) return new NextResponse("Store ID is required", { status: 400 });

    const products = await prismadb.product.findMany({
      where: {
        storeId: resolvedParams.storeId,
        categoryId,
        isArchived: false,
        isFeatured,
        ...(sizeId && { productSizes: { some: { sizeId } } }),
        ...(colorId && { productColors: { some: { colorId } } }),
      },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
        giftPrices: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const CMS_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";

    const formatted = products.map((p) => ({
      ...p,
      images: p.images.map((img) => ({
        ...img,
        url: `${CMS_URL}${img.localUrl}`
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}