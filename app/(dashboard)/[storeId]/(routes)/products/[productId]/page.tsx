import prismadb from "@/lib/prismadb";
import { ObjectId } from "mongodb";
import { ProductForm } from "./components/product-form";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductPage = async ({ params }: any) => {
  const resolvedParams = await params;

  const categories = await prismadb.category.findMany({
    where: {
      storeId: resolvedParams.storeId,
    },
  });

  const sizes = await prismadb.size.findMany({
    where: {
      storeId: resolvedParams.storeId,
    },
  });

  const colors = await prismadb.color.findMany({
    where: {
      storeId: resolvedParams.storeId,
    },
  });

  if (resolvedParams.productId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <ProductForm categories={categories} sizes={sizes} colors={colors} initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.productId)) {
    return <div>Невалидный ID-товара</div>;
  }

  const product = await prismadb.product.findUnique({
    where: {
      id: resolvedParams.productId,
    },
    include: {
      images: true,
      productSizes: {
        include: {
          size: true,
        },
      },
      productColors: {
        include: {
          color: true,
        },
      },
      giftPrices: true,
    },
  });

  if (!product) {
    return <div>Нет товаров</div>;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm categories={categories} sizes={sizes} colors={colors} initialData={product} />
      </div>
    </div>
  );
};

export default ProductPage;
