/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
  try {
    const { orderId, clientName, clientEmail, clientPhone, amount } = await req.json();
    console.log("📌 INPUT:", { orderId, clientName, clientEmail, clientPhone, amount });

    const PAYKEEPER_URL = "https://likesvet.server.paykeeper.ru";
    const USER = process.env.PAYKEEPER_USER!;
    const PASSWORD = process.env.PAYKEEPER_PASS!;

    if (!USER || !PASSWORD) {
      console.error("❌ Missing PayKeeper credentials");
      throw new Error("Missing PayKeeper credentials");
    }

    const auth = Buffer.from(`${USER}:${PASSWORD}`).toString("base64");
    const baseHeaders = {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // 1️⃣ Ottieni token CSRF
    console.log("🔐 Richiedo token CSRF...");
    const tokenRes = await fetch(`${PAYKEEPER_URL}/info/settings/token/`, {
      method: "GET",
      headers: baseHeaders
    });

    console.log("📌 TOKEN RESPONSE STATUS:", tokenRes.status);
    const tokenText = await tokenRes.text();
    console.log("📌 TOKEN RAW:", tokenText);

    if (!tokenRes.ok) {
      throw new Error(`Errore token: ${tokenRes.status} - ${tokenText}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      throw new Error(`Token response parse error: ${e}`);
    }

    if (!tokenData?.token) {
      throw new Error("Token not received: " + JSON.stringify(tokenData));
    }
    const token = tokenData.token;
    console.log("✅ Token CSRF obteined");

    // 2️⃣ Prepara dati con validazione
    const paymentData = new URLSearchParams();
    paymentData.append('pay_amount', Number(amount).toFixed(2));
    paymentData.append('clientid', (clientName || "Customer").substring(0, 128));
    paymentData.append('orderid', String(orderId).substring(0, 128));
    paymentData.append('client_email', clientEmail || '');
    paymentData.append('client_phone', clientPhone ? clientPhone.replace(/\D/g, '') : '');
    paymentData.append('service_name', 'Оплата заказа Likesvet');
    paymentData.append('token', token);

    console.log("📌 PAYMENT DATA PARAMS:");
    paymentData.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    // 3️⃣ Richiesta invoice
    console.log("🧾 Creazione invoice...");
    const invoiceRes = await fetch(`${PAYKEEPER_URL}/change/invoice/preview/`, {
      method: "POST",
      headers: baseHeaders,
      body: paymentData.toString(),
    });

    console.log("📌 INVOICE RESPONSE STATUS:", invoiceRes.status);
    console.log("📌 INVOICE RESPONSE OK:", invoiceRes.ok);

    const invoiceText = await invoiceRes.text();
    console.log("📌 INVOICE RAW RESPONSE:", invoiceText);

    // Controlla se è HTML error
    if (invoiceText.includes('error') || invoiceText.includes('Ошибка')) {
      console.error("❌ PayKeeper returned error page");
      throw new Error("Payment gateway error: " + invoiceText.substring(0, 200));
    }

    let invoiceData;
    try {
      invoiceData = JSON.parse(invoiceText);
    } catch (e) {
      throw new Error(`Invoice response parse error: ${e}. Response: ${invoiceText}`);
    }

    if (!invoiceData?.invoice_id) {
      console.error("❌ Invoice data:", invoiceData);
      throw new Error("invoice_id mancante nella risposta");
    }

    const invoiceId = invoiceData.invoice_id;
    const paymentLink = `${PAYKEEPER_URL}/bill/${invoiceId}/`;

    console.log("✅ SUCCESS - PAYMENT LINK:", paymentLink);

    // 🔥 4️⃣ SALVA invoiceId NELL'ORDINE
    await prismadb.order.update({
      where: { id: orderId },
      data: { invoiceId }
    });

    return NextResponse.json({
      success: true,
      invoiceId,
      paymentLink
    });

  } catch (err: any) {
    console.error("❌ PAYKEEPER ERROR:", err.message);
    console.error("❌ FULL ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message || "Payment gateway error",
      details: "Please contact support: Likesvet@gmail.com"
    }, { status: 500 });
  }
}