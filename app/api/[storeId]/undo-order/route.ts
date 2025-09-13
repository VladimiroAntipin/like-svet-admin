import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new NextResponse("Missing orderId", { status: 400 });
    }

    // Trova l'ordine senza filtrare troppo su isPaid
    const order = await prismadb.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Rimborsa balance solo se presente
    if (order.customerId && (order.usedBalance ?? 0) > 0) {
      try {
        await prismadb.customer.update({
          where: { id: order.customerId },
          data: { balance: { increment: order.usedBalance ?? 0 } },
        });
        console.log(`Balance refunded to customer ${order.customerId}: ${order.usedBalance}`);
      } catch (err) {
        console.error(`Error refunding balance for customer ${order.customerId}:`, err);
      }
    }

    // Elimina ordine
    await prismadb.order.delete({ where: { id: orderId } });
    console.log(`Order deleted: ${orderId}`);

    return NextResponse.json({ message: `Order ${orderId} deleted successfully` });
  } catch (err) {
    console.error("[UNDO_ORDER]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}