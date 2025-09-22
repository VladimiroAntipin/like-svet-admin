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
            return new NextResponse("Not authenticated", { status: 401 });
        }

        const body = await req.json();
        const { name, imageUrl } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!imageUrl) {
            return new NextResponse("Image is required", { status: 400 });
        }

        if (!resolvedParams.storeId) {
            return new NextResponse("Store ID is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: resolvedParams.storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const category = await prismadb.category.create({
            data: {
                name,
                imageUrl,
                storeId: resolvedParams.storeId,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORIES_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
    const resolvedParams = await params;
    try {
        if (!resolvedParams.storeId) {
            return new NextResponse("Store ID is required", { status: 400 });
        }

        const categories = await prismadb.category.findMany({
            where: { storeId: resolvedParams.storeId },
        });

        const CMS_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";

        const formatted = categories.map((c) => ({
            ...c,
            imageUrl: `${CMS_URL}${c.localUrl}`
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("[CATEGORIES_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}