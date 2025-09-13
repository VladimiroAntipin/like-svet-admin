"use client";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Customer } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Trash, Eye, EyeOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

// Schema
const balanceSchema = z.number().min(0, "Баланс не может быть отрицательным");

export const formSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  profileImage: z.string().optional(),
  birthDate: z.string().optional(),
  email: z.string().email("Невалидный email"),
  phone: z.string().min(5, "Телефон обязателен"),
  password: z.string().optional(),
  balance: balanceSchema,
});

export type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  initialData: Customer | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const params = useParams();
  const router = useRouter();
  const [balanceRub, setBalanceRub] = useState<number>(
    initialData ? (initialData.balance ?? 0) / 100 : 0
  );

  const title = initialData ? "Редактировать клиента" : "Создать клиента";
  const description = initialData
    ? "Изменение данных клиента"
    : "Создание нового клиента";
  const toastMessage = initialData ? "Клиент обновлен" : "Клиент создан";
  const action = initialData ? "Сохранить" : "Создать";

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        profileImage: initialData.profileImage || "",
        birthDate: initialData.birthDate
          ? new Date(initialData.birthDate).toISOString().split("T")[0]
          : "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        password: "",
        balance: initialData.balance ? initialData.balance / 100 : 0,
      }
      : {
        firstName: "",
        lastName: "",
        profileImage: "",
        birthDate: "",
        email: "",
        phone: "",
        password: "",
        balance: 0,
      },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        balance: Math.round(balanceRub * 100),
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
      };

      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/customers/${params.customerId}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `/api/${params.storeId}/customers`,
          payload,
          { withCredentials: true }
        );
      }

      router.refresh();
      router.push(`/${params.storeId}/customers`);
      toast.success(toastMessage);
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при сохранении клиента");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/customers/${params.customerId}`,
        { withCredentials: true }
      );
      router.refresh();
      router.push(`/${params.storeId}/customers`);
      toast.success("Клиент удален");
    } catch (error) {
      console.error(error);
      toast.error("Ошибка при удалении клиента");
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
          {/* Аватар */}
          <FormField
            control={form.control}
            name="profileImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Аватар</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ? [field.value] : []}
                    disabled={loading}
                    onChange={(url) => field.onChange(url)}
                    onRemove={() => field.onChange("")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Имя и Фамилия */}
          <div className="grid grid-cols-2 gap-8 max-[500px]:grid-cols-1">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Имя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фамилия</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Фамилия" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Дата рождения */}
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата рождения</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={loading}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Баланс */}
          <FormField
            control={form.control}
            name="balance"
            render={() => (
              <FormItem>
                <FormLabel>Баланс</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    value={balanceRub}
                    onChange={(e) => setBalanceRub(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Телефон */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Телефон" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Пароль nuovo */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Новый пароль</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      disabled={loading}
                      placeholder="Введите новый пароль"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};