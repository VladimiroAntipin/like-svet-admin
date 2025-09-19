import prismadb from "@/lib/prismadb";
import { OrderClient } from "./components/client";
import { OrderColumn } from "./components/columns";
import { formatter } from "@/lib/utils";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrdersPage = async ({ params }: any) => {
  const { storeId } = params;

  // Prendi tutti gli ordini del negozio
  const orders = await prismadb.order.findMany({
    where: { storeId },
    include: {
      customer: true,
      orderItems: {
        include: {
          product: {
            include: {
              images: true,
              productSizes: { include: { size: true } },
              productColors: { include: { color: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Formatta gli ordini nello stesso schema che lo stream invierà
  const formattedOrders: OrderColumn[] = orders.map((order) => ({
    id: order.id,
    client: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`,
    contacts: `${order.customer?.phone || ""} ${order.customer?.email || ""}`,
    region: order.region,
    address: order.address,
    apartment: order.apartment || undefined,
    floor: order.floor || undefined,
    entrance: order.entrance || undefined,
    extraInfo: order.extraInfo || undefined,
    products: order.orderItems.map((oi) => {
      const sizeName = oi.sizeId
        ? oi.product.productSizes.find((ps) => ps.sizeId === oi.sizeId)?.size.name
        : undefined;

      const colorName = oi.colorId
        ? oi.product.productColors.find((pc) => pc.colorId === oi.colorId)?.color.name
        : undefined;

      return {
        name: oi.product.name,
        size: sizeName,
        color: colorName,
        imageUrl: oi.product.images[0]?.url ?? "",
      };
    }),
    totalPrice: formatter(order.totalPrice),
    shippingMethod: order.shippingMethod,
    isPaid: order.isPaid,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;