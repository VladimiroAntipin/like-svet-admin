import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.colorId) {
            return new NextResponse('Color ID is required', { status: 400 });
        }

        const color = await prismadb.color.findUnique({
            where: {
                id: resolvedParams.colorId,
            },
        });

        return NextResponse.json(color);
    } catch (error) {
        console.error('[COLOR_GET]', error);
        return new NextResponse('Failed to get color', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await authServer({
            headers: {
                get: (name: string) => req.headers.get(name),
            },
        });

        const body = await req.json();
        const { name, value } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        if (!value) {
            return new NextResponse('Value is required', { status: 400 });
        }

        if (!resolvedParams.colorId) {
            return new NextResponse('Color ID is required', { status: 400 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: resolvedParams.storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const color = await prismadb.color.update({
            where: {
                id: resolvedParams.colorId,
            },
            data: {
                name,
                value,
            },
        });

        return NextResponse.json(color);
    } catch (error) {
        console.error('[COLOR_PATCH]', error);
        return new NextResponse('Failed to update color', { status: 500 });
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        const { userId } = await authServer({
            headers: {
                get: (name: string) => req.headers.get(name),
            },
        });

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!resolvedParams.colorId) {
            return new NextResponse('Color ID is required', { status: 400 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse('Store ID is required', { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: resolvedParams.storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const color = await prismadb.color.delete({
            where: {
                id: resolvedParams.colorId,
            },
        });

        return NextResponse.json(color);
    } catch (error) {
        console.error('[COLOR_DELETE]', error);
        return new NextResponse('Failed to delete color', { status: 500 });
    }
};