import prismadb from "@/lib/prismadb";
import { GiftCodesClient } from "./components/client";
import { GiftCodeColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GiftCodesPage = async ({ params }: any) => {
  const resolvedParams = await params;

  const giftCodes = await prismadb.giftCode.findMany({
    where: { storeId: resolvedParams.storeId },
    include: {
      redemption: {
        include: {
          customer: true,
        },
      },
      purchases: { // 👈 aggiunta
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedGiftCodes: GiftCodeColumn[] = giftCodes.map((item) => ({
    id: item.id,
    code: item.code,
    amount: `${(item.amount / 100).toFixed(2)} ₽`,
    createdAt: item.createdAt.toISOString(),
    expiresAt: item.expiresAt ? item.expiresAt.toISOString() : "—",
    purchasedBy:
      item.purchases.length > 0 && item.purchases[0].customer
        ? `${item.purchases[0].customer.firstName} ${item.purchases[0].customer.lastName}`
        : "—",
    redeemed: item.redemption ? "✅" : "❌",
    redeemedBy: item.redemption?.customer
      ? `${item.redemption.customer.firstName} ${item.redemption.customer.lastName}`
      : "—",
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <GiftCodesClient data={formattedGiftCodes} />
      </div>
    </div>
  );
};

export default GiftCodesPage;
