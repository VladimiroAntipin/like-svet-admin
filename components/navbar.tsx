import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { ThemeToggle } from "./theme-toggle";
import { MainNav } from "@/components/main-nav";
import StoreSwitcher from "@/components/store-switcher";
import { UserMenu } from "./ui/user-menu";
import { verifyToken } from "@/lib/server/auth/tokens";
import DownloadImagesButton from "./download-images-button";

export const runtime = 'nodejs';

const Navbar = async ({ storeId }: { storeId: string }) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect("/sign-in");
  }

  const user = await verifyToken(accessToken!);

  if (!user) {
    redirect("/sign-in");
  }

  const stores = await prismadb.store.findMany({ where: { userId: user.userId } });

  return (
    <div
      className="fixed top-0 left-0 w-full border-b b z-50 bg-[var(--background)]"
      style={{ paddingTop: "env(safe-area-inset-top)", minHeight: `calc(4rem + env(safe-area-inset-top))` }}
    >
      <div className="flex flex-row h-16 items-center px-4 max-[1435px]:flex-col max-[1435px]:items-start max-[1435px]:gap-4 max-[1435px]:h-22 max-[1435px]:relative max-[1435px]:pt-1 max-[1080px]:h-30 max-[960px]:h-40 max-[620px]:h-45 max-[500px]:h-30">
        <StoreSwitcher items={stores} />
        <MainNav className="mx-6 max-[1435px]:mx-0 max-[1080px]:w-full max-[500px]:w-full" />
        <div className="ml-auto flex items-center space-x-4 max-[1435px]:absolute max-[1435px]:top-1 max-[1435px]:right-4">
          <DownloadImagesButton storeId={storeId} />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default Navbar;