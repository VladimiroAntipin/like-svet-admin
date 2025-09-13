import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const { payload } = await jwtVerify(token, JWT_SECRET);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (payload as any).id as string;
        if (!userId) return new NextResponse("Invalid token", { status: 401 });

        const body = await req.json();
        const { code } = body;
        if (!code) return new NextResponse("Promo code required", { status: 400 });

        // Trova il codice promo
        const promo = await prismadb.giftCode.findUnique({
            where: { code },
            include: { redemption: true },
        });

        if (!promo) return new NextResponse("Promo code not found", { status: 404 });
        if (!promo.isActive) return new NextResponse("Promo code already used", { status: 400 });
        if (promo.expiresAt && promo.expiresAt < new Date())
            return new NextResponse("Promo code expired", { status: 400 });

        // Se qualcuno ha già redento questo codice → blocca
        if (promo.redemption) {
            return new NextResponse("Promo code already redeemed", { status: 400 });
        }

        // Prendi il saldo corrente dell’utente
        const customer = await prismadb.customer.findUnique({ where: { id: userId } });
        if (!customer) return new NextResponse("User not found", { status: 404 });

        const currentBalance = Number(customer.balance ?? 0);
        const promoAmount = Number(promo.amount ?? 0);

        // Aggiorna il saldo dell’utente
        const updatedCustomer = await prismadb.customer.update({
            where: { id: userId },
            data: { balance: currentBalance + promoAmount },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                birthDate: true,
                profileImage: true,
                balance: true,
            },
        });

        // 🔥 Crea la redemption e disattiva il codice
        await prismadb.giftCode.update({
            where: { code },
            data: {
                isActive: false,
                redemption: {
                    create: {
                        customerId: userId,
                        redeemedAt: new Date(),
                    },
                },
            },
        });

        return NextResponse.json({
            message: "Promo code redeemed successfully",
            user: updatedCustomer,
        });
    } catch (err) {
        console.error("[PROMO_REDEEM_POST]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

