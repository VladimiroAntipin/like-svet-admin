import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { CustomerClient } from "./components/client";
import { CustomerColumn } from "./components/columns";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
const CustomersPage = async ({ params }: any) => {
  const customers = await prismadb.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  const formattedCustomers: CustomerColumn[] = customers.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    contacts: `${c.phone || "—"}||${c.email}`,
    balance: c.balance,
    createdAt: format(c.createdAt, "dd/MM/yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CustomerClient data={formattedCustomers} />
      </div>
    </div>
  );
};

export default CustomersPage;
