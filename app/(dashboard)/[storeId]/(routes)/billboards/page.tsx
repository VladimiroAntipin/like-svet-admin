import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { BillboardClient } from "./components/client";
import { BillboardColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BillboardsPage = async ({ params }: any) => {
    const resolvedParams = await params;
    const billboards = await prismadb.billboard.findMany({
        where: {
            storeId: resolvedParams.storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedBillboards: BillboardColumn[] = billboards.map((item) => ({
        id: item.id,
        label: item.label,
        createdAt: format(item.createdAt, "dd/MM/yyyy")
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <BillboardClient data={formattedBillboards} />
            </div>
        </div>
    );
}

export default BillboardsPage;