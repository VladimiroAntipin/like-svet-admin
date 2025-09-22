import prismadb from "@/lib/prismadb";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: { storeId: string } }) {

    let userId: string | null = null;
    try {
        const authData = await auth();
        userId = authData.userId;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
    }

    if (!userId) {
        redirect('/sign-in');
    }

    const store = await prismadb.store.findFirst({
        where: {
            id: params.storeId,
            userId
        }
    });

    if (!store) {
        redirect('/');
    } else {
    }

    return (
        <>
            <Navbar storeId={params.storeId}/>
            <main className="
                pt-[calc(64px+env(safe-area-inset-top))]
                max-[1435px]:pt-[calc(88px+env(safe-area-inset-top))]
                max-[1080px]:pt-[calc(120px+env(safe-area-inset-top))]
                max-[960px]:pt-[calc(160px+env(safe-area-inset-top))]
                max-[620px]:pt-[calc(180px+env(safe-area-inset-top))]
                max-[500px]:pt-[calc(120px+env(safe-area-inset-top))]
                ">
                {children}
            </main>
        </>
    )
}