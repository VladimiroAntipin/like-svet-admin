import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clients: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const { storeId } = params; // storeId arriva dal folder [storeId]
  if (!storeId) return new NextResponse("Missing storeId", { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // aggiungiamo il client
      clients.push({ storeId, controller, encoder });

      // rimuovi il client quando la connessione è chiusa
      req.signal.addEventListener("abort", () => {
        clients = clients.filter(c => c.controller !== controller);
      });
    }
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function notifyNewOrder(order: any) {
  clients.forEach(client => {
    if (client.storeId === order.storeId) {
      const data = `data: ${JSON.stringify(order)}\n\n`;
      client.controller.enqueue(client.encoder.encode(data));
    }
  });
}