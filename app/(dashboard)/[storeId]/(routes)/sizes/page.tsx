import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { SizesClient } from "./components/client";
import { SizeColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SizesPage = async ({ params }: any) => {
    const resolvedParams = await params;
    const sizes = await prismadb.size.findMany({
        where: {
            storeId: resolvedParams.storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedSizes: SizeColumn[] = sizes.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        createdAt: format(item.createdAt, "dd/MM/yyyy")
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SizesClient data={formattedSizes} />
            </div>
        </div>
    );
}

export default SizesPage;