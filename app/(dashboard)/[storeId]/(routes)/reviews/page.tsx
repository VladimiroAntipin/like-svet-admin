import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { ReviewClient } from "./components/client";
import { ReviewColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BillboardsPage = async ({ params }: any) => {
    const resolvedParams = await params;
    const reviews = await prismadb.review.findMany({
        where: {
            storeId: resolvedParams.storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedReviews: ReviewColumn[] = reviews.map((item) => ({
        id: item.id,
        label: item.label,
        createdAt: format(item.createdAt, "dd/MM/yyyy")
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ReviewClient data={formattedReviews} />
            </div>
        </div>
    );
}

export default BillboardsPage;