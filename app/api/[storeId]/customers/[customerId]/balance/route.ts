import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
    try {
        const { customerId } = await params;
        const body = await req.json();
        const { amount } = body;

        if (!customerId) {
            return new NextResponse("Customer ID is required", { status: 400 });
        }

        const customer = await prismadb.customer.update({
            where: { id: customerId },
            data: {
                balance: {
                    increment: amount,
                },
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("[CUSTOMER_BALANCE_PATCH]", error);
        return new NextResponse("Не удалось обновить баланс", { status: 500 });
    }
}