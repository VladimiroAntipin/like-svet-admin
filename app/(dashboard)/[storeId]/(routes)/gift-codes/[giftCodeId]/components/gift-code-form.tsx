"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, type Resolver } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { GiftCode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Trash } from "lucide-react";
import { AlertModal } from "@/components/modals/alert-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

// Zod schema
const formSchema = z.object({
  code: z.string().min(3, "Код должен содержать минимум 3 символа"),
  amount: z.coerce.number().min(1, "Сумма должна быть положительной"),
  isActive: z.boolean().default(true),
  expiresAt: z.date().nullable().optional(),
});

// Tipi derivati dallo schema
type GiftCodeFormValues = z.infer<typeof formSchema>;

interface GiftCodeFormProps {
  initialData: GiftCode | null;
}

export const GiftCodeForm: React.FC<GiftCodeFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Редактировать сертификат" : "Создать сертификат";
  const description = initialData
    ? "Измените данные сертификата."
    : "Добавьте новый сертификат.";
  const toastMessage = initialData ? "Сертиификат обновлен" : "Сертификат создан";
  const action = initialData ? "Сохранить изменения" : "Создать";

  const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const form = useForm<GiftCodeFormValues>({
    resolver: zodResolver(formSchema) as Resolver<GiftCodeFormValues>,
    defaultValues: initialData
      ? {
        code: initialData.code,
        amount: initialData.amount / 100,
        isActive: initialData.isActive,
        expiresAt: initialData.expiresAt ? new Date(initialData.expiresAt) : defaultExpiry,
      }
      : {
        code: "",
        amount: 0,
        isActive: true,
        expiresAt: defaultExpiry,
      },
  });

  const onSubmit: SubmitHandler<GiftCodeFormValues> = async (data) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/gift-codes/${params.giftCodeId}`,
          {
            ...data,
            amount: data.amount * 100,
            expiresAt: data.expiresAt || defaultExpiry,
          },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `/api/${params.storeId}/gift-codes`,
          {
            ...data,
            amount: data.amount * 100,
            expiresAt: data.expiresAt || defaultExpiry,
          },
          { withCredentials: true }
        );
      }
      router.refresh();
      router.push(`/${params.storeId}/gift-codes`);
      toast.success(toastMessage);
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/gift-codes/${params.giftCodeId}`,
        { withCredentials: true }
      );
      router.refresh();
      router.push(`/${params.storeId}/gift-codes`);
      toast.success("Сертификат удален");
    } catch {
      toast.error("Ошибка при удалении");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Код</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Например, WELCOME2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма (₽)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    disabled={loading}
                    placeholder="500"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата окончания</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={loading}
                      className="w-full justify-start text-left font-normal"
                    >
                      {field.value ? format(field.value, "dd/MM/yyyy") : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => field.onChange(date || null)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Активен</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};