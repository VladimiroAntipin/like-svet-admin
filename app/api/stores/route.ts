// app/api/stores/route.ts
import prismadb from "@/lib/prismadb";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { userId } = await auth(req);

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const stores = await prismadb.store.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(stores);
    } catch (error) {
        console.error('[STORES_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth(req);
        const body = await req.json();
        const { name } = body;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!name) {
            return new NextResponse('Invalid store name', { status: 400 });
        }

        const store = await prismadb.store.create({
            data: {
                name,
                userId,
            },
        });
        return NextResponse.json(store);
    } catch (error) {
        console.log('[STORES_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}