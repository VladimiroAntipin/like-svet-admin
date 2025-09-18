'use client';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ReviewColumn, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";

interface ReviewClientProps {
    data: ReviewColumn[];
}

export const ReviewClient: React.FC<ReviewClientProps> = ({ data }) => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const currentPage = searchParams?.get("page") ?? "1";

    return (
        <>
            <div className="flex items-center justify-between max-[500px]:flex-col max-[500px]:gap-y-8">
                <Heading title={`Отзывы (${(data.length)})`} description="Управление отзывами для вашего магазина" />
                <Button
                    className="max-[500px]:w-full cursor-pointer"
                    onClick={() => router.push(`/${params.storeId}/reviews/new?page=${currentPage}`)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить отзыв
                </Button>
            </div>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="label" />
            <Heading title="API" description="API вызовы для отзывов" />
            <Separator />
            <ApiList entityName="reviews" entityIdName="reviewId" />
        </>
    )
}