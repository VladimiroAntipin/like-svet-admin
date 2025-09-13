import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

// GET all gift codes for a store
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const giftCodes = await prismadb.giftCode.findMany({
      where: { storeId: resolvedParams.storeId },
      orderBy: { createdAt: "desc" },
      include: {
        redemption: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(giftCodes);
  } catch (error) {
    console.error("[GIFT_CODES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// CREATE new gift code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const body = await req.json();
    const { code, amount, expiresAt } = body;

    if (!code || !amount) {
      return new NextResponse("Code and amount are required", { status: 400 });
    }

    const giftCode = await prismadb.giftCode.create({
      data: {
        storeId: resolvedParams.storeId,
        code,
        amount,
        // se non viene passata una data, default a 365 giorni dalla creazione
        expiresAt: expiresAt
          ? new Date(expiresAt)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(giftCode);
  } catch (error) {
    console.error("[GIFT_CODES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}