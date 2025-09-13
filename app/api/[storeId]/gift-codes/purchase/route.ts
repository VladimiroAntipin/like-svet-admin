import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// funzione helper per generare un codice random
function generateGiftCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // senza 0 e O
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
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
    const { amount, expiresAt, orderItemId } = body;

    if (!amount || !orderItemId) {
      return new NextResponse("amount and orderItemId are required", { status: 400 });
    }

    // controlla se esiste già un gift code per questo item
    const existingPurchase = await prismadb.giftCodePurchase.findFirst({
      where: { orderItemId }
    });

    if (existingPurchase) {
      return NextResponse.json({
        message: "Gift code already exists for this order item",
        giftCode: await prismadb.giftCode.findUnique({ where: { id: existingPurchase.giftCodeId } }),
        purchase: existingPurchase
      });
    }

    // genera un codice unico
    let code: string;
    let exists = true;
    do {
      code = generateGiftCode();
      const existing = await prismadb.giftCode.findUnique({ where: { code } });
      exists = !!existing;
    } while (exists);

    const defaultExpiration = new Date();
    defaultExpiration.setDate(defaultExpiration.getDate() + 365);

    // crea il gift code
    const giftCode = await prismadb.giftCode.create({
      data: {
        storeId: params.storeId,
        code,
        amount,
        expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiration
      }
    });

    // registra l'acquisto collegandolo all'item dell'ordine
    const purchase = await prismadb.giftCodePurchase.create({
      data: {
        giftCodeId: giftCode.id,
        customerId: userId,
        orderItemId,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    return NextResponse.json({ message: "Gift code purchased successfully", giftCode, purchase });
  } catch (err) {
    console.error("[GIFT_CODE_PURCHASE_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
