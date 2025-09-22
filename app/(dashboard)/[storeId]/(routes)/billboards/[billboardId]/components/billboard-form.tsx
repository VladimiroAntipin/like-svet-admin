'use client';

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Billboard } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

interface BillboardFormProps {
    initialData: Billboard | null;
}

const formSchema = z.object({
    label: z.string().min(1),
    imageUrl: z.string().min(1)
})

type BillboardFormValues = z.infer<typeof formSchema>;

export const BillboardForm: React.FC<BillboardFormProps> = ({ initialData }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const title = initialData ? 'Редактировать баннер' : 'Создать баннер';
    const description = initialData ? 'Управление баннерами для вашего магазина' : 'Создание нового баннера';
    const toastMessage = initialData ? 'Баннер обновлен' : 'Баннер создан';
    const action = initialData ? 'Сохранить' : 'Создать';

    const form = useForm<BillboardFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            label: '',
            imageUrl: ''
        }
    });

    const getPage = () => searchParams?.get("page") ?? "1";

    const onSubmit = async (data: BillboardFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(
                    `/api/${params.storeId}/billboards/${params.billboardId}`,
                    data,
                    { withCredentials: true }
                );
            } else {
                await axios.post(
                    `/api/${params.storeId}/billboards`,
                    data,
                    { withCredentials: true }
                );
            }
            router.refresh();
            const page = getPage();
            router.push(`/${params.storeId}/billboards?page=${page}`);
            toast.success(toastMessage);
        } catch (error) {
            console.error("[BILLBOARD_FORM]", error);
            toast.error('Не удалось сохранить баннер');
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(
                `/api/${params.storeId}/billboards/${params.billboardId}`,
                { withCredentials: true }
            );
            router.refresh();
            const page = getPage();
            router.push(`/${params.storeId}/billboards?page=${page}`);
            toast.success('Баннер удален');
        } catch (error) {
            console.error("[BILLBOARD_FORM_DELETE]", error);
            toast.error('Не удалось удалить баннер. Убедитесь, что нет связанных данных.');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button disabled={loading} variant='destructive' size='sm' className="cursor-pointer" onClick={() => setOpen(true)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Изображение</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value ? [{ id: 'single', url: field.value }] : []}
                                    disabled={loading}
                                    onChange={(url) => field.onChange(url)}
                                    onRemove={() => field.onChange('')}
                                    move={() => { }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-8 max-[500px]:grid-cols-1">
                        <FormField control={form.control} name="label" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Текст</FormLabel>
                                <FormControl>
                                    <Input disabled={loading} placeholder="Текст для вашего баннера" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <Button disabled={loading} className="ml-auto cursor-pointer" type="submit">{action}</Button>
                </form>
            </Form>
        </>
    )
}