import { NextResponse } from "next/server";
import { addClient, removeClient } from "./clients";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: any) {
  const { storeId } = params;
  if (!storeId) return new NextResponse("Missing storeId", { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      addClient(storeId, controller, encoder);

      req.signal.addEventListener("abort", () => {
        removeClient(controller);
      });
    }
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}