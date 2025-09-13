import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.categoryId) {
            return new NextResponse('Category ID is required', { status: 400 });
        }

        const category = await prismadb.category.findUnique({
            where: {
                id: resolvedParams.categoryId,
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('[CATEGORY_GET]', error);
        return new NextResponse('Failed to get category', { status: 500 });
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
        const { name, imageUrl } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Name is required', { status: 400 });
        }

        if (!imageUrl) {
            return new NextResponse('Image is required', { status: 400 });
        }

        if (!resolvedParams.categoryId) {
            return new NextResponse('Category ID is required', { status: 400 });
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

        const category = await prismadb.category.update({
            where: {
                id: resolvedParams.categoryId,
            },
            data: {
                name,
                imageUrl,
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('[CATEGORY_PATCH]', error);
        return new NextResponse('Failed to update category', { status: 500 });
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

        if (!resolvedParams.categoryId) {
            return new NextResponse('Category ID is required', { status: 400 });
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

        const category = await prismadb.category.delete({
            where: {
                id: resolvedParams.categoryId,
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('[CATEGORY_DELETE]', error);
        return new NextResponse('Failed to delete category', { status: 500 });
    }
};