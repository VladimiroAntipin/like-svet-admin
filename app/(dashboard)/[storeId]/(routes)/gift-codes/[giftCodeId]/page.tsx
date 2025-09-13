import prismadb from "@/lib/prismadb";
import { GiftCodeForm } from "./components/gift-code-form";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GiftCodePage = async ({ params }: any) => {
  const { giftCodeId } = await params;

  let giftCode = null;
  if (giftCodeId !== "new") {
    giftCode = await prismadb.giftCode.findUnique({
      where: {
        id: giftCodeId,
      },
    });
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <GiftCodeForm initialData={giftCode} />
      </div>
    </div>
  );
};

export default GiftCodePage;