import prismadb from "@/lib/prismadb";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/settings-form";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SettingsPage = async ({ params }: any) => {
    const resolvedParams = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const store = await prismadb.store.findFirst({
        where: {
            id: resolvedParams.storeId,
            userId
        }
    });

    if (!store) {
        redirect('/');
    }

    return ( 
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SettingsForm initialData={store}/>
            </div>
        </div>
     );
}
 
export default SettingsPage;