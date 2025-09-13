import prismadb from "@/lib/prismadb";
import { SizeForm } from "./components/size-form";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SizePage = async ({ params }: any) => {
  const resolvedParams = await params;
  if (resolvedParams.sizeId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <SizeForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.sizeId)) {
    return <div>Невалидный ID размера</div>;
  }

  const size = await prismadb.size.findUnique({
    where: {
      id: resolvedParams.sizeId
    }
  });

  if (!size) {
    return <div>Нет размеров</div>;
  }
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SizeForm initialData={size} />
      </div>
    </div>
  );
}

export default SizePage;