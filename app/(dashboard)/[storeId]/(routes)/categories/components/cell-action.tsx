'use client';

import React, { useState } from "react";
import { CategoryColumn } from "./columns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import toast from "react-hot-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { AlertModal } from "@/components/modals/alert-modal";

interface CellActionProps {
    data: CategoryColumn
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success('ID скопирован в буфер обмена');
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(
                `/api/${params.storeId}/categories/${data.id}`,
                { withCredentials: true }
            );
            router.refresh();
            toast.success('Категория удалена');

            const currentPage = searchParams?.get("page") ?? "1";
            router.push(`/${params.storeId}/categories?page=${currentPage}`);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Необхлдимо удалить все товары из этой категории');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    const handleEdit = () => {
        const currentPage = searchParams?.get("page") ?? "1";
        router.push(`/${params.storeId}/categories/${data.id}?page=${currentPage}`);
    }

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className="w-8 h-8 p-0 cursor-pointer">
                        <span className='sr-only'>Меню</span>
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Действия</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onCopy(data.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Скопировать ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Удалить
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}