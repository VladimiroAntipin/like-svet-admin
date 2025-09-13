import { authServer } from "@/lib/auth";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await authServer({
            headers: {
                get: (name: string) => req.headers.get(name),
            },
        });

        if (!userId) {
            return new NextResponse('Not authenticated', { status: 401 });
        }

        const body = await req.json();
        const { label, imageUrl } = body;

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
        });

        if (!storeByUserId) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const billboard = await prismadb.billboard.create({
            data: {
                label,
                imageUrl,
                storeId: resolvedParams.storeId
            },
        });

        return NextResponse.json(billboard);
    } catch (error) {
        console.error('[BILLBOARDS_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const billboards = await prismadb.billboard.findMany({
            where: { storeId: resolvedParams.storeId },
        });

        return NextResponse.json(billboards);
    } catch (error) {
        console.error('[BILLBOARDS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
};