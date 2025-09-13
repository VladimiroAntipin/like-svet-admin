import prismadb from "@/lib/prismadb";
import { BillboardForm } from "./components/billboard-form";
import { ObjectId } from "mongodb";
import { Billboard } from "@prisma/client";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BillboardPage = async ({ params }: any) => {
  const { billboardId } = params;

  if (billboardId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <BillboardForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(billboardId)) {
    return <div>Невалидный ID-баннера</div>;
  }

  const billboard: Billboard | null = await prismadb.billboard.findUnique({
    where: { id: billboardId },
  });

  if (!billboard) {
    return <div>Нет баннеров</div>;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;
