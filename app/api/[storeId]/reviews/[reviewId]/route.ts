import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// ================= GET REVIEW BY ID =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    if (!resolvedParams.reviewId) {
      return new NextResponse("Review ID is required", { status: 400 });
    }

    const review = await prismadb.review.findUnique({
      where: { id: resolvedParams.reviewId },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEW_GET]", error);
    return new NextResponse("Failed to get review", { status: 500 });
  }
}

// ================= UPDATE REVIEW =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { userId } = await authServer({
      headers: {
        get: (name: string) => req.headers.get(name),
      },
    });

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { label, imageUrl } = body;

    if (!label) return new NextResponse("Text is required", { status: 400 });
    if (!imageUrl) return new NextResponse("Image is required", { status: 400 });
    if (!resolvedParams.reviewId) return new NextResponse("Review ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const review = await prismadb.review.updateMany({
      where: { id: resolvedParams.reviewId },
      data: { label, imageUrl },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEW_PATCH]", error);
    return new NextResponse("Failed to update review", { status: 500 });
  }
}

// ================= DELETE REVIEW =================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { userId } = await authServer({
      headers: {
        get: (name: string) => req.headers.get(name),
      },
    });

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!resolvedParams.reviewId) return new NextResponse("Review ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: resolvedParams.storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const review = await prismadb.review.deleteMany({
      where: { id: resolvedParams.reviewId },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEW_DELETE]", error);
    return new NextResponse("Failed to delete review", { status: 500 });
  }
}