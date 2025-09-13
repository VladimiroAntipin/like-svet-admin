'use client';

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cssColorNames } from "@/lib/cssColors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Color } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

interface ColorFormProps {
    initialData: Color | null;
}

const formSchema = z.object({
    name: z.string().min(1),
    value: z.string().refine((val) => {
        return cssColorNames.includes(val.toLowerCase());
    }, {
        message: "Insert a valid CSS color (es: red, blue, green)"
    })
});

type ColorFormValues = z.infer<typeof formSchema>;

export const ColorForm: React.FC<ColorFormProps> = ({ initialData }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const router = useRouter();

    const title = initialData ? 'Редактировать цветов' : 'Создать цвет';
    const description = initialData ? 'Управление цветами товаров в магазине' : 'Создание нового цвета';
    const toastMessage = initialData ? 'Цвет обновлен' : 'Цвет создан';
    const action = initialData ? 'Сохранить' : 'Создать';

    const form = useForm<ColorFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: '',
            value: ''
        }
    });

    const onSubmit = async (data: ColorFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(
                    `/api/${params.storeId}/colors/${params.colorId}`,
                    data,
                    { withCredentials: true }
                );
            } else {
                await axios.post(
                    `/api/${params.storeId}/colors`,
                    data,
                    { withCredentials: true }
                );
            }
            router.refresh();
            router.push(`/${params.storeId}/colors`)
            toast.success(toastMessage);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Не удалось обновить цвет');
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(
                `/api/${params.storeId}/colors/${params.colorId}`,
                { withCredentials: true }
            );
            router.refresh();
            router.push(`/${params.storeId}/colors`);
            toast.success('цвет удален');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Необхлдимо удалить все товары с этой цвет перед удалением');
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
                    <div className="grid grid-cols-3 gap-8 max-[500px]:grid-cols-1">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Название</FormLabel>
                                <FormControl >
                                    <Input disabled={loading} placeholder="Название цвета" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="value" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Цвет</FormLabel>
                                <FormControl >
                                    <div className="flex items-center gap-x-4">
                                        <Input disabled={loading} placeholder="На англиском: red, blue..." {...field} />
                                        <div className="border p-4 rounded-full" style={{ backgroundColor: field.value }} />
                                    </div>
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