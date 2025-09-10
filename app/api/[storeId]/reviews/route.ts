import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
    const resolvedParams = await params
    try {
        const { userId } = await auth(req);
        const body = await req.json();
        const { label, imageUrl } = body;

        if (!userId) {
            return new NextResponse('Not authenticated', { status: 401 });
        }

        if (!label) {
            return new NextResponse('Text is required', { status: 400 });
        }

        if (!imageUrl) {
            return new NextResponse('Image is required', { status: 400 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: resolvedParams.storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const review = await prismadb.review.create({
            data: {
                label,
                imageUrl,
                storeId: resolvedParams.storeId
            },
        });
        return NextResponse.json(review);
    } catch (error) {
        console.log('[REVIEWS_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params
    try {
        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const reviews = await prismadb.review.findMany({
            where: {
                storeId: resolvedParams.storeId
            }
        });
        return NextResponse.json(reviews);
    } catch (error) {
        console.log('[REVIEWS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};