import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (payload as any).id as string;
    if (!userId) {
      return new NextResponse("Invalid token", { status: 401 });
    }

    const { storeId } = await params;

    // Recuperiamo tutti gli ordini dell'utente per lo store corrente
    const orders = await prismadb.order.findMany({
      where: {
        customerId: userId,
        storeId,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
            giftCodePurchases: {
              include: {
                giftCode: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mappiamo i dati per il client
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      region: order.region,
      address: order.address,
      apartment: order.apartment,
      floor: order.floor,
      entrance: order.entrance,
      extraInfo: order.extraInfo,
      shippingMethod: order.shippingMethod,
      totalAmount: order.totalPrice,
      products: order.orderItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.giftCardAmount
          ? item.giftCardAmount * 100
          : item.product.price,
        images: item.product.images,
        category: item.product.category,
        giftCardAmount: item.giftCardAmount,
        // prendo il primo codice disponibile (oppure null)
        giftCode:
          item.giftCodePurchases.length > 0
            ? item.giftCodePurchases[0].giftCode.code
            : null,
      })),
    }));

    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (err) {
    console.error("[ORDERS_BY_CLIENT_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}