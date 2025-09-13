import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prismadb from "@/lib/prismadb";

export const runtime = 'nodejs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
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

        const favorites = await prismadb.favorite.findMany({
            where: { customerId: userId },
            include: {
                product: {
                    include: {
                        images: true,
                        category: true,
                    },
                },
            },
        });

        return NextResponse.json(favorites);
    } catch (err) {
        console.error("[FAVORITES_GET]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) return new NextResponse("Unauthorized", { status: 401 });

        const token = authHeader.split(" ")[1];
        const { payload } = await jwtVerify(token, JWT_SECRET);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (payload as any).id as string;
        if (!userId) return new NextResponse("Invalid token", { status: 401 });

        const body = await req.json();
        const { productId } = body;

        const favorite = await prismadb.favorite.upsert({
            where: { customerId_productId: { customerId: userId, productId } },
            create: { customerId: userId, productId },
            update: {},
        });

        return NextResponse.json(favorite);
    } catch (err) {
        console.error("[FAVORITE_POST]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
            return new NextResponse("Unauthorized", { status: 401 });

        const token = authHeader.split(" ")[1];
        const { payload } = await jwtVerify(token, JWT_SECRET);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (payload as any).id as string;
        if (!userId) return new NextResponse("Invalid token", { status: 401 });

        const body = await req.json();
        const { productId } = body;

        await prismadb.favorite.delete({
            where: { customerId_productId: { customerId: userId, productId } },
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (err) {
        console.error("[FAVORITE_DELETE]", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}