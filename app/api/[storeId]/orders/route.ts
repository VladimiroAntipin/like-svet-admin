import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
    try {
        const { storeId } = await params;

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

        const body = await req.json();
        const { items, region, address, apartment, floor, entrance, extraInfo, totalPrice, shippingMethod, usedBalance } = body;

        if (!items || !items.length) {
            return new NextResponse("Missing items", { status: 400 });
        }

        const order = await prismadb.order.create({
            data: {
                storeId,
                customerId: userId,
                region,
                address,
                apartment,
                floor,
                entrance,
                extraInfo,
                shippingMethod,
                totalPrice,
                usedBalance,
                isPaid: false,
                orderItems: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        sizeId: item.sizeId,
                        colorId: item.colorId,
                        giftCardAmount: item.giftCardAmount,
                        giftCodeId: item.giftCodeId,
                    })),
                },
            },
            include: {
                orderItems: true,
            },
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("[ORDERS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
