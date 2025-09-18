import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// ================= GET PRODUCT BY ID =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    if (!resolvedParams.productId) return new NextResponse("Product ID is required", { status: 400 });

    const product = await prismadb.product.findUnique({
      where: { id: resolvedParams.productId },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
        giftPrices: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Failed to get product", { status: 500 });
  }
}

// ================= UPDATE PRODUCT =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
  const resolvedParams = await params;
  const { storeId, productId } = resolvedParams;

  try {
    const { userId } = await authServer({
      headers: {
        get: (name: string) => req.headers.get(name),
      },
    });
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, description, price, categoryId, sizeIds, colorIds, images, isFeatured, isArchived, isGiftCard, giftPrices } = body;

    if (!productId) return new NextResponse("Product ID is required", { status: 400 });
    if (!storeId) return new NextResponse("Store ID is required", { status: 400 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!images?.length) return new NextResponse("Images are required", { status: 400 });
    if (!categoryId) return new NextResponse("Category ID is required", { status: 400 });
    if (!sizeIds?.length) return new NextResponse("At least one size is required", { status: 400 });
    if (!colorIds?.length) return new NextResponse("At least one color is required", { status: 400 });
    if (isGiftCard && (!giftPrices?.length)) return new NextResponse("Gift prices are required", { status: 400 });
    if (!isGiftCard && (price === undefined || price === null)) return new NextResponse("Price is required", { status: 400 });

    const storeByUser = await prismadb.store.findFirst({ where: { id: storeId, userId } });
    if (!storeByUser) return new NextResponse("Unauthorized", { status: 403 });

    // aggiorna i campi principali
    await prismadb.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: isGiftCard ? null : price,
        categoryId,
        isFeatured: !!isFeatured,
        isArchived: !!isArchived,
        isGiftCard: !!isGiftCard,
      },
    });

    // immagini: ricrea
    await prismadb.image.deleteMany({ where: { productId } });
    if (images && images.length) {
      await prismadb.image.createMany({ data: images.map((img: { url: string }) => ({ productId, url: img.url })) });
    }

    // multiprezzi gift card
    await prismadb.giftCardPrice.deleteMany({ where: { productId } });
    if (isGiftCard && giftPrices?.length) {
      await prismadb.giftCardPrice.createMany({ data: giftPrices.map((gp: { value: number }) => ({ productId, value: gp.value })) });
    }

    // taglie
    await prismadb.productSize.deleteMany({ where: { productId } });
    if (sizeIds && sizeIds.length) {
      await prismadb.productSize.createMany({ data: sizeIds.map((sizeId: string) => ({ productId, sizeId })) });
    }

    // colori
    await prismadb.productColor.deleteMany({ where: { productId } });
    if (colorIds && colorIds.length) {
      await prismadb.productColor.createMany({ data: colorIds.map((colorId: string) => ({ productId, colorId })) });
    }

    // prodotto aggiornato completo
    const updated = await prismadb.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        category: true,
        productSizes: { include: { size: true } },
        productColors: { include: { color: true } },
        giftPrices: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return new NextResponse("Failed to update product", { status: 500 });
  }
}

// ================= DELETE PRODUCT =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { userId } = await authServer({
      headers: {
        get: (name: string) => req.headers.get(name),
      },
    });
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { storeId, productId } = resolvedParams;
    if (!productId) return new NextResponse("Product ID is required", { status: 400 });
    if (!storeId) return new NextResponse("Store ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: storeId, userId }
    });
    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    // pulizia relazioni
    await prismadb.giftCardPrice.deleteMany({ where: { productId } });
    await prismadb.image.deleteMany({ where: { productId } });
    await prismadb.productSize.deleteMany({ where: { productId } });
    await prismadb.productColor.deleteMany({ where: { productId } });
    await prismadb.favorite.deleteMany({ where: { productId } });
    await prismadb.orderItem.deleteMany({ where: { productId } });

    // elimina il prodotto
    await prismadb.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Failed to delete product", { status: 500 });
  }
}