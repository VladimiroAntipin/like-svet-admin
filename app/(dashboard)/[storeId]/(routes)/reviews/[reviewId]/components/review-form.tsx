'use client';

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Review } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

interface ReviewFormProps {
    initialData: Review | null;
}

const formSchema = z.object({
    label: z.string().min(1),
    imageUrl: z.string().min(1)
})

type ReviewFormValues = z.infer<typeof formSchema>;

export const ReviewForm: React.FC<ReviewFormProps> = ({ initialData }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const title = initialData ? 'Редактировать отзыв' : 'Создать отзыв';
    const description = initialData ? 'Управление отзывами для вашего магазина' : 'Создание нового отзыв';
    const toastMessage = initialData ? 'Отзыв обновлен' : 'Отзыв создан';
    const action = initialData ? 'Сохранить' : 'Создать';

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            label: '',
            imageUrl: ''
        }
    });

    const getPage = () => searchParams?.get("page") ?? "1";

    const onSubmit = async (data: ReviewFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(
                    `/api/${params.storeId}/reviews/${params.reviewId}`,
                    data,
                    { withCredentials: true }
                );
            } else {
                await axios.post(
                    `/api/${params.storeId}/reviews`,
                    data,
                    { withCredentials: true }
                );
            }
            router.refresh();
            const page = getPage();
            router.push(`/${params.storeId}/reviews?page=${page}`);
            toast.success(toastMessage);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Не удалось обновить магазин');
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(
                `/api/${params.storeId}/reviews/${params.reviewId}`,
                { withCredentials: true }
            );
            router.refresh();
            const page = getPage();
            router.push(`/${params.storeId}/reviews?page=${page}`);
            toast.success('Отзыв удален');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('что-то пошло не так');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
            <div className="flex item-center justify-between">
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
                            <FormControl >
                                <ImageUpload value={field.value ? [field.value] : []} disabled={loading} onChange={(url) => field.onChange(url)} onRemove={() => field.onChange('')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-8 max-[500px]:grid-cols-1">
                        <FormField control={form.control} name="label" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Текст</FormLabel>
                                <FormControl >
                                    <Input disabled={loading} placeholder="Название отзыва (eg: отзыв от...)" {...field} />
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