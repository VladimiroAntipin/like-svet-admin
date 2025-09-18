import prismadb from "@/lib/prismadb";
import { OrderClient } from "./components/client";
import { OrderColumn } from "./components/columns";
import { formatter } from "@/lib/utils";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrdersPage = async ({ params }: any) => {
  const { storeId } = await params;

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

  const formattedOrders: OrderColumn[] = orders.map((item) => ({
    id: item.id,
    client: `${item.customer?.firstName || ""} ${item.customer?.lastName || ""}`,
    contacts: `${item.customer?.phone || ""} ${item.customer?.email || ""}`,
    region: item.region,
    address: item.address,
    apartment: item.apartment || undefined,
    floor: item.floor || undefined,
    entrance: item.entrance || undefined,
    extraInfo: item.extraInfo || undefined,
    products: item.orderItems.map((oi) => {
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
    totalPrice: formatter(item.totalPrice),
    shippingMethod: item.shippingMethod,
    isPaid: item.isPaid,
    createdAt: item.createdAt.toISOString()
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
