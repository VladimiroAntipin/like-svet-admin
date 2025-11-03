import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    try {
        const { storeId, orderId } = await params;

        const order = await prismadb.order.findFirst({
            where: {
                id: orderId,
                storeId,
            },
            include: {
                orderItems: true,
            },
        });

        if (!order) return new NextResponse("Order not found", { status: 404 });

        return NextResponse.json(order, { status: 200 });
    } catch (err) {
        console.error("[ORDER_GET]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { storeId, orderId } = await params;
    const body = await req.json();

    // Se il body contiene trackNumber, aggiorna solo quello
    if (body.trackNumber !== undefined) {
      const updatedOrder = await prismadb.order.update({
        where: { id: orderId },
        data: { trackNumber: body.trackNumber },
      });
      return NextResponse.json(updatedOrder);
    }

    // Altrimenti controlla se c'è isPaid
    if (typeof body.isPaid === "boolean") {
      const updatedOrder = await prismadb.order.update({
        where: { id: orderId },
        data: { isPaid: body.isPaid },
      });
      return NextResponse.json(updatedOrder);
    }

    return new NextResponse("Missing isPaid or trackNumber", { status: 400 });

  } catch (err) {
    console.error("[ORDER_PATCH]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { storeId, orderId } = await params;

        if (!orderId) {
            return new NextResponse("Order ID is required", { status: 400 });
        }

        // Recupera l'ordine dal db
        const order = await prismadb.order.findFirst({
            where: { id: orderId },
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        // Controlla se l'ordine è già pagato
        if (order.isPaid) {
            return new NextResponse("Order already paid, cannot delete", { status: 400 });
        }

        // Elimina l'ordine
        await prismadb.order.delete({
            where: { id: orderId },
        });

        return new NextResponse("Order deleted", { status: 200 });
    } catch (err) {
        console.error("[ORDER_DELETE]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}