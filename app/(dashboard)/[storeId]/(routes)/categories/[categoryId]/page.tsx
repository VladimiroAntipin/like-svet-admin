import prismadb from "@/lib/prismadb";
import { CategoryForm } from "./components/category-form";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CategoryPage = async ({ params }: any) => {
  const resolvedParams = await params;
  
  if (resolvedParams.categoryId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <CategoryForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.categoryId)) {
    return <div>Невалидный ID</div>;
  }

  const category = await prismadb.category.findUnique({
    where: {
      id: resolvedParams.categoryId
    }
  });

  if (!category) {
    return <div>Нет категорий</div>;
  }
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm initialData={category} />
      </div>
    </div>
  );
}

export default CategoryPage;