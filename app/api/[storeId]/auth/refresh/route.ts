import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const ACCESS_TOKEN_EXPIRES_IN = "1d";
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; 

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
  const { storeId } = await params;

  if (!storeId) {
    return new NextResponse("Store ID is required", { status: 400 });
  }

  try {
    // --- Parse cookie header robustly ---
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map(s => s.trim())
        .filter(Boolean)
        .map(c => {
          const idx = c.indexOf("=");
          return [c.slice(0, idx), c.slice(idx + 1)];
        })
    );
    const refreshToken = cookies["refreshToken"];

    if (!refreshToken) {
      return new NextResponse("No refresh token", { status: 401 });
    }

    // --- Verifica refresh token ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      console.error("[REFRESH_INVALID_TOKEN]", err);
      return new NextResponse("Invalid refresh token", { status: 401 });
    }

    const userId = payload?.id;
    if (!userId) return new NextResponse("Invalid token payload", { status: 401 });

    // --- Controlla DB: token corrisponde a quello salvato? ---
    const user = await prismadb.customer.findUnique({ where: { id: userId } });
    if (!user) return new NextResponse("User not found", { status: 401 });
    if (user.refreshToken !== refreshToken) {
      return new NextResponse("Refresh token mismatch", { status: 401 });
    }

    // --- Genera nuovi token ---
    const newRefreshToken = jwt.sign(
      { id: user.id, storeId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, storeId },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    // --- Salva nuovo refresh token in DB ---
    await prismadb.customer.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // --- Prepara response ---
    const response = NextResponse.json({
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        profileImage: user.profileImage,
        balance: user.balance,
      },
    });

    // --- Impostazioni cookie coerenti dev/prod ---
    const IS_PROD = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined; // es. ".likesvet.com" in prod

    response.cookies.set({
      name: "refreshToken",
      value: newRefreshToken,
      httpOnly: true,
      path: "/",
      sameSite: "none", 
      secure: IS_PROD,   // true in prod, false in dev
      domain: cookieDomain,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });

    response.headers.set("Vary", "Origin");

    return response;
  } catch (err) {
    console.error("[REFRESH_ERROR]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
