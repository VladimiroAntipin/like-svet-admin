'use client';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SizeColumn, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";

interface SizesClientProps {
    data: SizeColumn[];
}

export const SizesClient: React.FC<SizesClientProps> = ({ data }) => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const currentPage = searchParams?.get("page") ?? "1";

    return (
        <>
            <div className="flex items-center justify-between max-[500px]:flex-col max-[500px]:gap-y-8">
                <Heading title={`Размеры (${data.length})`} description="Управление размерами товаров в магазине" />
                <Button 
                    className="max-[500px]:w-full cursor-pointer" 
                    onClick={() => router.push(`/${params.storeId}/sizes/new?page=${currentPage}`)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить размер
                </Button>
            </div>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="value" />
            <Heading title="API" description="API вызовы для размеров" />
            <Separator />
            <ApiList entityName="sizes" entityIdName="sizeId" />
        </>
    )
}