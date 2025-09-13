import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { ProductClient } from "./components/client";
import { ProductColumn } from "./components/columns";
import { formatter } from "@/lib/utils";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductsPage = async ({ params }: any) => {
  const resolvedParams = await params;
  const products = await prismadb.product.findMany({
    where: {
      storeId: resolvedParams.storeId,
    },
    include: {
      category: true,
      productSizes: { include: { size: true } },
      productColors: { include: { color: true } },
      giftPrices: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedProducts: ProductColumn[] = products.map((item) => {
    let priceList: string[];
    if (item.isGiftCard) {
      priceList = item.giftPrices.map((gp) => formatter(gp.value));
    } else {
      priceList = item.price ? [formatter(item.price)] : ["—"];
    }

    return {
      id: item.id,
      name: item.name,
      isFeatured: item.isFeatured,
      isArchived: item.isArchived,
      price: priceList,
      category: item.category?.name ?? "—",
      size: item.productSizes.map((ps) => ps.size.name),
      color: item.productColors.map((pc) => pc.color.name),
      createdAt: format(item.createdAt, "dd/MM/yyyy"),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
