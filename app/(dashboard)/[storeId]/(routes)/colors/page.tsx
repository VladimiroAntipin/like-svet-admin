import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { ColorsClient } from "./components/client";
import { ColorColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SizesPage = async ({ params }: any) => {
    const resolvedParams = await params;
    const colors = await prismadb.color.findMany({
        where: {
            storeId: resolvedParams.storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedColors: ColorColumn[] = colors.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        createdAt: format(item.createdAt, "dd/MM/yyyy")
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ColorsClient data={formattedColors} />
            </div>
        </div>
    );
}

export default SizesPage;