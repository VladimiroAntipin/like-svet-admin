import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

// GET single gift code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const giftCode = await prismadb.giftCode.findFirst({
      where: {
        id: resolvedParams.giftCodeId,
        storeId: resolvedParams.storeId,
      },
    });

    if (!giftCode) {
      return new NextResponse("Gift code not found", { status: 404 });
    }

    return NextResponse.json(giftCode);
  } catch (error) {
    console.error("[GIFT_CODE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// UPDATE gift code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const body = await req.json();
    const { code, amount, isActive, expiresAt } = body;

    // Controllo automatico: se expiresAt è passato → isActive = false
    let activeStatus = isActive;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      activeStatus = false;
    }

    const giftCode = await prismadb.giftCode.updateMany({
      where: {
        id: resolvedParams.giftCodeId,
        storeId: resolvedParams.storeId,
      },
      data: {
        code,
        amount,
        isActive: activeStatus,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    if (giftCode.count === 0) {
      return new NextResponse("Gift code not found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GIFT_CODE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE gift code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    await prismadb.giftCodeRedemption.deleteMany({
      where: {
        giftCodeId: resolvedParams.giftCodeId,
      },
    });

    await prismadb.giftCodePurchase.deleteMany({
      where: {
        giftCodeId: resolvedParams.giftCodeId,
      },
    });

    const deleted = await prismadb.giftCode.deleteMany({
      where: {
        id: resolvedParams.giftCodeId,
        storeId: resolvedParams.storeId,
      },
    });

    if (deleted.count === 0) {
      return new NextResponse("Gift code not found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GIFT_CODE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
