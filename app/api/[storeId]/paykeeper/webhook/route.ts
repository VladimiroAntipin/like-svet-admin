import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import crypto from "crypto";
import { SignJWT } from "jose";

// ===============================
// HELPERS
// ===============================
async function fetchPaymentInfo(invoiceId: string) {
  const PAYKEEPER_URL = "https://likesvet.server.paykeeper.ru";
  const USER = process.env.PAYKEEPER_USER!;
  const PASSWORD = process.env.PAYKEEPER_PASS!;
  const auth = Buffer.from(`${USER}:${PASSWORD}`).toString("base64");

  const res = await fetch(`${PAYKEEPER_URL}/info/payments/byid/?id=${invoiceId}`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });

  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) throw new Error("Invalid PayKeeper response");

  return json[0];
}

// ===============================
// SERVER TOKEN
// ===============================
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function generateServerToken() {
  const token = await new SignJWT({ id: "system" }) // userId fittizio "system"
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(JWT_SECRET);
  return token;
}

// ===============================
// GENERAZIONE GIFT CODE
// ===============================
async function generateGiftCode(amount: number, orderItemId: string, customerId: string, token: string, retries = 3) {
  const CMS_URL = process.env.NEXT_PUBLIC_API_URL!;
  while (retries > 0) {
    try {
      const res = await fetch(`${CMS_URL}/gift-codes/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, orderItemId, customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gift code API failed");
      return data;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// ===============================
// WEBHOOK PAYKEEPER
// ===============================
export async function POST(req: Request) {
  try {
    const PAYKEEPER_SECRET = process.env.PAYKEEPER_SECRET;
    if (!PAYKEEPER_SECRET) throw new Error("PAYKEEPER_SECRET not set");

    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);

    const invoiceId = params.get("id")!;
    const sum = params.get("sum")!;
    const clientid = params.get("clientid") || "";
    const orderId = params.get("orderid")!;
    const key = params.get("key")!;

    // Calcola hash MD5
    const hash = crypto
      .createHash("md5")
      .update(invoiceId + parseFloat(sum).toFixed(2) + clientid + orderId + PAYKEEPER_SECRET)
      .digest("hex");

    if (key !== hash) {
      console.warn("❌ Invalid key from PayKeeper", { key, hash });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("🔎 PayKeeper webhook valid:", { invoiceId, orderId, sum, clientid });

    // Trova ordine tramite orderId
    const order = await prismadb.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      console.warn("❌ Order not found for orderId:", orderId);
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order.isPaid) {
      console.log("⚠️ Order already marked as paid:", orderId);
      return new NextResponse(`OK ${hash}`, { status: 200 });
    }

    // Controlla pagamento
    const payment = await fetchPaymentInfo(invoiceId);
    const paymentAmount = parseFloat(payment.pay_amount);
    const orderAmount = (order.totalPrice ?? 0) / 100;

    if (paymentAmount < orderAmount) {
      console.log("⏳ Payment not completed yet: amount mismatch", { expected: orderAmount, got: paymentAmount });
      return NextResponse.json({ success: true, status: "pending" });
    }

    // Aggiorna ordine come pagato
    const updatedOrder = await prismadb.order.update({
      where: { id: orderId },
      data: { isPaid: true },
      include: { orderItems: true },
    });

    // Genera token server
    const serverToken = await generateServerToken();

    // Genera gift code per ogni item gift card
    const giftItems = updatedOrder.orderItems.filter((item) => (item.giftCardAmount ?? 0) > 0);
    for (const item of giftItems) {
      try {
        console.log("💳 Generating gift code", { amount: item.giftCardAmount, orderItemId: item.id });
        await generateGiftCode(
          (item.giftCardAmount ?? 0) * 100,
          item.id,
          order.customerId!, // collega il customer corretto
          serverToken
        );
      } catch (err) {
        console.error(`❌ Failed to generate gift code for item ${item.id}`, err);
      }
    }

    console.log("✅ Order marked as paid and gift codes generated");

    return new NextResponse(`OK ${hash}`, { status: 200 });
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
