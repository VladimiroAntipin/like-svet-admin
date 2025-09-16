import prismadb from "@/lib/prismadb";
import axios from "axios";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        // Trova tutti gli ordini non pagati più vecchi di 15 minuti
        const unpaidOrders = await prismadb.order.findMany({
            where: { isPaid: false, createdAt: { lt: fifteenMinutesAgo } },
        });

        let processedCount = 0;

        for (const order of unpaidOrders) {
            // Restituisci balance via PATCH se c'è customerId e usedBalance > 0
            if (order.customerId && (order.usedBalance ?? 0) > 0) {
                try {
                    await axios.patch(
                        `${process.env.NEXT_PUBLIC_API_URL}/customers/${order.customerId}/balance`,
                        { amount: order.usedBalance }
                    );
                    console.log(`Balance refunded to customer ${order.customerId}: ${order.usedBalance}`);
                } catch (err) {
                    console.error(`Error updating balance for customer ${order.customerId}:`, err);
                }
            }

            // Elimina ordine non pagato
            try {
                await prismadb.order.delete({ where: { id: order.id } });
                processedCount++;
                console.log(`Order deleted: ${order.id}`);
            } catch (err) {
                console.error(`Error deleting order ${order.id}:`, err);
            }
        }

        return NextResponse.json({ message: `${processedCount} deleted orders` });
    } catch (err) {
        console.error("[CLEANUP_UNPAID_ORDERS]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}