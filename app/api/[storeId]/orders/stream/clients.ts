// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clients: any[] = [];

export function addClient(storeId: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  clients.push({ storeId, controller, encoder });
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients = clients.filter(c => c.controller !== controller);
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