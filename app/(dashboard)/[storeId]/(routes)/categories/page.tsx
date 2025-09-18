import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { CategoryClient } from "./components/client";
import { CategoryColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CategoriesPage = async ({ params }: any) => {
    const resolvedParams = await params;
    const categories = await prismadb.category.findMany({
        where: {
            storeId: resolvedParams.storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedCategories: CategoryColumn[] = categories.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl ?? "",
        createdAt: format(item.createdAt, "dd/MM/yyyy")
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryClient data={formattedCategories} />
            </div>
        </div>
    );
}

export default CategoriesPage;