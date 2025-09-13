'use client';

import { useStoreModal } from "@/hooks/use-store-modal";
import { Modal } from "@/components/ui/modal";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const formSchema = z.object({
  name: z.string().min(1),
})

export const StoreModal = () => {
  const storeModal = useStoreModal();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/stores', values, { withCredentials: true });

      if (response.data?.id) {
        window.location.assign(`/${response.data.id}`);
      } else {
        console.warn('[StoreModal] No store ID returned from API');
        toast.error("Не удалось создать магазин: нет ID");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Что-то пошло не так при создании магазина");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Создать магазин"
      description="Создайте магазин, чтобы начать продавать, управлять товары и заказы."
      isOpen={storeModal.isOpen}
      onClose={() => {
        console.log('[StoreModal] Modal closed');
        storeModal.onClose();
      }}
    >
      <div className="space-y-4 py-2 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Название магазина</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Твой магазин" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="pt-6 flex justify-end space-x-2">
              <Button disabled={loading} variant="outline" onClick={() => {
                console.log('[StoreModal] Cancel button clicked');
                storeModal.onClose();
              }}>
                Отменить
              </Button>
              <Button disabled={loading} type="submit">
                Далее
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}