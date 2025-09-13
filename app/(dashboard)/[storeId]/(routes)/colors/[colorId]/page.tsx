import prismadb from "@/lib/prismadb";
import { ColorForm } from "./components/color-form";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ColorPage = async ({ params }: any) => {
  const resolvedParams = await params;
  if (resolvedParams.colorId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <ColorForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.colorId)) {
    return <div>Невалидный ID цвета</div>;
  }

  const color = await prismadb.color.findUnique({
    where: {
      id: resolvedParams.colorId
    }
  });

  if (!color) {
    return <div>Нет цветов</div>;
  }
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ColorForm initialData={color} />
      </div>
    </div>
  );
}

export default ColorPage;