'use client';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { OrderColumn, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useEffect, useState } from "react";

interface OrderClientProps {
    data: OrderColumn[];
}

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
    const [orders, setOrders] = useState<OrderColumn[]>(data);

        useEffect(() => {
        const pathParts = window.location.pathname.split("/");
        const storeId = pathParts[2];

        const evtSource = new EventSource(`/api/${storeId}/orders/stream`);

        evtSource.onmessage = (event) => {
            const newOrder = JSON.parse(event.data);
            setOrders(prev => [newOrder, ...prev]);
        };

        return () => {
            evtSource.close();
        };
    }, []);
    
    return (
        <>
            <Heading title={`Заказы (${(data.length)})`} description="Управление заказами для вашего магазина" />
            <Separator />
            <DataTable columns={columns} data={orders} searchKey="contacts" />
        </>
    )
}