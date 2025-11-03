import prismadb from "@/lib/prismadb";
import { ObjectId } from "mongodb";
import { OrderForm } from "./components/order-form";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrderPage = async ({ params }: any) => {
  const { orderId } = params;

  if (!ObjectId.isValid(orderId)) {
    return <div>Невалидный ID заказа</div>;
  }

  const order = await prismadb.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      orderItems: {
        include: {
          product: {
            include: {
              images: true,
              productSizes: { include: { size: true } },
              productColors: { include: { color: true } }
            }
          }
        }
      }
    }
  });

  if (!order) {
    return <div>Заказ не найден</div>;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderForm initialData={order} />
      </div>
    </div>
  );
}

export default OrderPage;