import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, price, categoryId, sizeIds, colorIds, images, isFeatured, isArchived, isGiftCard, giftPrices } = body;

    if (!userId) return new NextResponse("Not authenticated", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!images || !images.length) return new NextResponse("Images are required", { status: 400 });
    if (!resolvedParams.storeId) return new NextResponse("Store ID is required", { status: 400 });
    if (!categoryId) return new NextResponse("Category ID is required", { status: 400 });
    if (!sizeIds?.length) return new NextResponse("At least one size is required", { status: 400 });
    if (!colorIds?.length) return new NextResponse("At least one color is required", { status: 400 });

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
        price: isGiftCard ? null : price,
        isGiftCard: !!isGiftCard,
        isFeatured,
        isArchived,
        categoryId,
        storeId: resolvedParams.storeId,
        images: { createMany: { data: images.map((img: { url: string }) => ({ url: img.url })) } },
        giftPrices: isGiftCard
          ? { createMany: { data: giftPrices.map((gp: { value: number }) => ({ value: gp.value })) } }
          : undefined,
      },
    });

    await prismadb.productSize.createMany({
      data: sizeIds.map((sizeId: string) => ({ productId: product.id, sizeId })),
    });

    await prismadb.productColor.createMany({
      data: colorIds.map((colorId: string) => ({ productId: product.id, colorId })),
    });

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
    const isFeatured = searchParams.get("isFeatured");

    if (!resolvedParams.storeId) return new NextResponse("Store ID is required", { status: 400 });

    const products = await prismadb.product.findMany({
      where: {
        storeId: resolvedParams.storeId,
        categoryId,
        isArchived: false,
        isFeatured: isFeatured ? true : undefined,
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

    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}