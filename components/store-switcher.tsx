'use client';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStoreModal } from "@/hooks/use-store-modal";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, PlusCircle, Store as StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Store } from "@prisma/client";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface StoreSwitcherProps extends PopoverTriggerProps {
    items: Store[];
}

export default function StoreSwitcher({ className, items = [] }: StoreSwitcherProps) {
    const storeModal = useStoreModal();
    const params = useParams();
    const router = useRouter();

    const formattedItems = items.map((item) => ({
        label: item.name,
        value: item.id
    }));

    const currentStore = formattedItems.find((item) => item.value === params.storeId);

    const [open, setOpen] = useState(false);

    const onStoreSelect = (store: { value: string, label: string }) => {
        setOpen(false);
        router.push(`/${store.value}`);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' size='sm' role='combobox' aria-expanded={open} aria-label="Выбрать магазин" className={cn('w-[200px] cursor-pointer justify-between max-[500px]:w-[50%] max-[500px]:mt-1', className)}>
                    <StoreIcon className="mr-2 h-4 w-4" />
                    {currentStore?.label}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 max-[500px]:w-[95vw] max-[500px]:ml-[2.5vw]">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Искать магазин..." />
                        <CommandEmpty>Не найдено</CommandEmpty>
                        <CommandGroup heading='Магазины'>
                            {formattedItems.map((store) => (
                                <CommandItem key={store.value} onSelect={() => onStoreSelect(store)} className='text-sm cursor-pointer'>
                                    <StoreIcon className="mr-2 h-4 w-4" />
                                    {store.label}
                                    <Check className={cn('ml-auto h-4 w-4', currentStore?.value === store.value ? 'opacity-100' : 'opacity-0')} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CommandItem className="cursor-pointer" onSelect={() => {
                                setOpen(false);
                                storeModal.onOpen();
                            }} >
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Создать магазин
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}