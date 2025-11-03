/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface TrackNumberFormProps {
  initialData: any;
}

interface FormValues {
  trackNumber?: string;
}

export const OrderForm: React.FC<TrackNumberFormProps> = ({ initialData }) => {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = searchParams?.get("page") ?? "1";

  const form = useForm<FormValues>({
    defaultValues: {
      trackNumber: initialData.trackNumber || ""
    }
  });

     const onSubmit = async (data: FormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(
                    `/api/${params.storeId}/orders/${params.orderId}`,
                    data,
                    { withCredentials: true }
                );
            }
            router.refresh();
            router.push(`/${params.storeId}/orders?page=${currentPage}`);
            toast.success('Заказ обновлен');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Не удалось обновить заказ');
        } finally {
            setLoading(false);
        }
    };

  return (
    <>
      <Heading title={`Заказ ID: ${initialData.id}`} description="Просмотр заказа и редактирование трек-номера" />
      <Separator className="my-4" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

         {/* Prodotti */}
          <div className="space-y-4">
            <FormLabel>Товары</FormLabel>
            {initialData.orderItems?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                {item.product.images[0]?.url && (
                  <Image src={item.product.images[0].url} alt={item.product.name} width={48} height={48} className="w-12 h-12 object-cover rounded-md" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{item.product.name}</span>
                  {item.sizeId && <span>Размер: {item.product.productSizes.find((ps: any) => ps.sizeId === item.sizeId)?.size.name}</span>}
                  {item.colorId && <span>Цвет: {item.product.productColors.find((pc: any) => pc.colorId === item.colorId)?.color.name}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Dati read-only dell'ordine */}
          <div className="grid grid-cols-1 gap-4">
            <FormItem>
              <FormLabel>Клиент</FormLabel>
              <FormControl>
                <Input
                  value={`${initialData.customer?.firstName || ""} ${initialData.customer?.lastName || ""}`}
                  readOnly
                  className="border rounded px-2 py-1 w-full bg-gray-100"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Контакты</FormLabel>
              <FormControl>
                <Input
                  value={`${initialData.customer?.phone || ""} ${initialData.customer?.email || ""}`}
                  readOnly
                  className="border rounded px-2 py-1 w-full bg-gray-100"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Адрес</FormLabel>
              <FormControl>
                <Input
                  value={`${initialData.region}, ${initialData.address}${initialData.apartment ? `, кв. ${initialData.apartment}` : ""}${initialData.floor ? `, этаж ${initialData.floor}` : ""}${initialData.entrance ? `, подъезд ${initialData.entrance}` : ""}`}
                  readOnly
                  className="border rounded px-2 py-1 w-full bg-gray-100"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Способ доставки</FormLabel>
              <FormControl>
                <Input
                  value={initialData.shippingMethod}
                  readOnly
                  className="border rounded px-2 py-1 w-full bg-gray-100"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Итого</FormLabel>
              <FormControl>
                <Input
                  value={initialData.totalPrice}
                  readOnly
                  className="border rounded px-2 py-1 w-full bg-gray-100"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Оплачено</FormLabel>
              <FormControl>
                <Input
                  value={initialData.isPaid ? "Да" : "Нет"}
                  readOnly
                  className="border rounded px-2 py-1 w-full bg-gray-100"
                />
              </FormControl>
            </FormItem>
          </div>

          {/* Input modificabile per trackNumber */}
          <FormField
            control={form.control}
            name="trackNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Трек-номер</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Введите трек-номер"
                    className="border rounded px-2 py-1 w-full"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="ml-auto">
            Сохранить
          </Button>
        </form>
      </Form>
    </>
  );
};