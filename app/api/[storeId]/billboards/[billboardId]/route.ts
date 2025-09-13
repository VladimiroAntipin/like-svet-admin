import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    if (!resolvedParams.billboardId) {
      return new NextResponse("Billboard ID is required", { status: 400 });
    }

    const billboard = await prismadb.billboard.findUnique({
      where: { id: resolvedParams.billboardId },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[BILLBOARD_GET]", error);
    return new NextResponse("Не удалось получить баннеры", { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    if (!resolvedParams.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!resolvedParams.billboardId) {
      return new NextResponse("Billboard ID is required", { status: 400 });
    }

    const { userId } = await authServer({
      headers: { get: (name: string) => req.headers.get(name) },
    });

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { label, imageUrl } = body;

    if (!label) return new NextResponse("Text is required", { status: 400 });
    if (!imageUrl) return new NextResponse("Image is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const billboard = await prismadb.billboard.updateMany({
      where: { id: resolvedParams.billboardId },
      data: { label, imageUrl },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[BILLBOARD_PATCH]", error);
    return new NextResponse("Не удалось обновить баннер", { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    if (!resolvedParams.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!resolvedParams.billboardId) {
      return new NextResponse("Billboard ID is required", { status: 400 });
    }

    const { userId } = await authServer({
      headers: { get: (name: string) => req.headers.get(name) },
    });

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const billboard = await prismadb.billboard.deleteMany({
      where: { id: resolvedParams.billboardId },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[BILLBOARD_DELETE]", error);
    return new NextResponse("Не удалось удалить баннер", { status: 500 });
  }
}