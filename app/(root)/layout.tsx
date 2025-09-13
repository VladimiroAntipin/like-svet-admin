import prismadb from "@/lib/prismadb";
import { authServer } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SetupLayout({ children, params }: any) {
  let userId: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

    const authData = await authServer({
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'cookie') return cookieHeader;
          return null;
        },
      },
    });

    userId = authData.userId;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    userId = null;
  }

  let store = null;
  if (userId) {
    store = await prismadb.store.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  } else {
  }

  const currentStoreId = params.storeId;

  if (store) {
    if (!currentStoreId || store.id !== currentStoreId) {
      redirect(`/${store.id}`);
    }
  } else {
  }

  return <>{children}</>;
}