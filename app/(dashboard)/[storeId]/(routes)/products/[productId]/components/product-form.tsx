'use client';

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Image, Product, Size, ProductSize, Color, ProductColor, GiftCardPrice } from "@prisma/client";
import axios from "axios";
import { ChevronDown, Trash } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

interface ProductFormProps {
    initialData: (Product & {
        images: Image[];
        productSizes: (ProductSize & { size: Size })[];
        productColors: (ProductColor & { color: Color })[];
        giftPrices?: GiftCardPrice[];
    }) | null;
    categories: Category[];
    sizes: Size[];
    colors: Color[];
}

const priceSchema = z.number().min(0.01, "Минимальная цена 0.01").optional();

const formSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    images: z.object({ url: z.string() }).array().min(1, "Добавьте хотя бы 1 фото"),
    price: priceSchema,
    giftPrices: z.array(z.object({ value: z.number().min(0.01) })).optional(),
    categoryId: z.string().min(1),
    sizeIds: z.string().array().min(1, "Необходимо выбрать хотя бы 1 размер"),
    colorIds: z.string().array().min(1, "Необходимо выбрать хотя бы 1 цвет"),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),
    isGiftCard: z.boolean().default(false).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories, sizes, colors }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = searchParams?.get("page") ?? "1";

    const title = initialData ? "Редактировать товар" : "Создать товар";
    const description = initialData ? "Управление товарами для вашего магазина" : "Создание нового товара";
    const toastMessage = initialData ? "Товар обновлен" : "Товар создан";
    const action = initialData ? "Сохранить" : "Создать";

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            images: initialData?.images?.map(img => ({ url: img.url })) || [],
            price: !initialData?.isGiftCard && initialData?.price != null ? initialData.price / 100 : undefined,
            giftPrices: [],
            categoryId: initialData?.categoryId || "",
            sizeIds: initialData?.productSizes?.map(ps => ps.sizeId) || [],
            colorIds: initialData?.productColors?.map(pc => pc.colorId) || [],
            isFeatured: initialData?.isFeatured || false,
            isArchived: initialData?.isArchived || false,
            isGiftCard: initialData?.isGiftCard || false,
        },
    });

    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
        control: form.control,
        name: "images",
    });

    const { fields: giftFields, append: appendGift, remove: removeGift, replace: replaceGift } = useFieldArray({
        control: form.control,
        name: "giftPrices",
    });

    useEffect(() => {
        if (initialData?.isGiftCard) {
            const values = initialData.giftPrices?.length
                ? initialData.giftPrices.map(gp => ({ value: gp.value / 100 }))
                : [{ value: 0 }];
            replaceGift(values);
        } else {
            replaceGift([]);
        }
    }, [initialData, replaceGift]);

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);
            const payload = {
                ...data,
                price: data.price !== undefined ? Math.round(data.price * 100) : null,
                giftPrices: data.giftPrices?.map(gp => ({ value: Math.round(gp.value * 100) })),
            };

            if (initialData) {
                await axios.patch(`/api/${params.storeId}/products/${params.productId}`, payload, { withCredentials: true });
            } else {
                await axios.post(`/api/${params.storeId}/products`, payload, { withCredentials: true });
            }

            router.refresh();
            router.push(`/${params.storeId}/products?page=${currentPage}`);
            toast.success(toastMessage);
        } catch {
            toast.error("Не удалось сохранить товар");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/products/${params.productId}`, { withCredentials: true });
            router.refresh();
            router.push(`/${params.storeId}/products?page=${currentPage}`);
            toast.success("Товар удален");
        } catch {
            toast.error("Что-то пошло не так");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />
            <div className="flex item-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button disabled={loading} variant="destructive" size="sm" onClick={() => setOpen(true)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">

                    {/* Images */}
                    <FormField control={form.control} name="images" render={() => (
                        <FormItem>
                            <FormLabel>Фото</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={imageFields.map(img => img.url)}
                                    disabled={loading}
                                    onChange={url => appendImage({ url })}
                                    onRemove={url => {
                                        const index = imageFields.findIndex(f => f.url === url);
                                        if (index >= 0) removeImage(index);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Name */}
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Название</FormLabel>
                            <FormControl>
                                <Input disabled={loading} placeholder="Имя товара" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Description */}
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Описание</FormLabel>
                            <FormControl>
                                <textarea
                                    disabled={loading}
                                    placeholder="Введите описание товара"
                                    className="w-full border rounded-md p-2"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Gift Card Toggle */}
                    <FormField control={form.control} name="isGiftCard" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div>
                                <FormLabel>Подарочная карта</FormLabel>
                                <FormDescription>
                                    Если выбрано — укажите несколько номиналов вместо обычной цены
                                </FormDescription>
                            </div>
                        </FormItem>
                    )} />

                    {/* Prezzo normale */}
                    {!form.watch("isGiftCard") && (
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Цена</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min=""
                                        value={field.value ?? ""}
                                        onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}

                    {/* Gift Prices */}
                    {form.watch("isGiftCard") && (
                        <FormField control={form.control} name="giftPrices" render={() => (
                            <FormItem>
                                <FormLabel>Номиналы</FormLabel>
                                <div className="space-y-2">
                                    {giftFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-center">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                {...form.register(`giftPrices.${index}.value`, { valueAsNumber: true })}
                                            />
                                            <Button type="button" variant="destructive" size="sm" onClick={() => removeGift(index)}>
                                                Удалить
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" onClick={() => appendGift({ value: 0 })}>
                                        Добавить номинал
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}

                    {/* Category */}
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Категория</FormLabel>
                            <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите категорию" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Sizes */}
                    <FormField control={form.control} name="sizeIds" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Размеры</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {field.value?.length
                                            ? sizes.filter(s => field.value.includes(s.id)).map(s => s.value).join(", ")
                                            : "Выберите размеры"}
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-2 max-h-60 overflow-y-auto bg-white dark:bg-gray-900" align="start" side="bottom" style={{ width: "var(--radix-popover-trigger-width)" }}>
                                    <div className="flex flex-col space-y-1">
                                        {sizes.map(size => {
                                            const isSelected = field.value?.includes(size.id);
                                            return (
                                                <label key={size.id} className="flex items-center space-x-2 cursor-pointer py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white">
                                                    <Checkbox checked={isSelected} onCheckedChange={checked => {
                                                        if (checked) field.onChange([...(field.value || []), size.id]);
                                                        else field.onChange(field.value?.filter(id => id !== size.id));
                                                    }} />
                                                    <span>{size.value}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Colors */}
                    <FormField control={form.control} name="colorIds" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Цвета</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {field.value?.length
                                            ? colors.filter(c => field.value.includes(c.id)).map(c => c.name).join(", ")
                                            : "Выберите цвета"}
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-2 max-h-60 overflow-y-auto  bg-white dark:bg-gray-900" align="start" side="bottom" style={{ width: "var(--radix-popover-trigger-width)" }}>
                                    <div className="flex flex-col space-y-1">
                                        {colors.map(color => {
                                            const isSelected = field.value?.includes(color.id);
                                            return (
                                                <label key={color.id} className="flex items-center space-x-2 cursor-pointer py-1 px-2 rounded-md  hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white">
                                                    <Checkbox checked={isSelected} onCheckedChange={checked => {
                                                        if (checked) field.onChange([...(field.value || []), color.id]);
                                                        else field.onChange(field.value?.filter(id => id !== color.id));
                                                    }} />
                                                    <span className="flex items-center space-x-2">
                                                        <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.value }} />
                                                        <span>{color.name}</span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Featured */}
                    <FormField control={form.control} name="isFeatured" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Рекомендуемые товары</FormLabel>
                                <FormDescription>Этот товар будет отображаться в разделе Смотрите также</FormDescription>
                            </div>
                        </FormItem>
                    )} />

                    {/* Archived */}
                    <FormField control={form.control} name="isArchived" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>В архиве</FormLabel>
                                <FormDescription>Этот товар будет недоступен для покупки</FormDescription>
                            </div>
                        </FormItem>
                    )} />

                    <Button disabled={loading} className="ml-auto cursor-pointer" type="submit">{action}</Button>
                </form>
            </Form>
        </>
    );
};