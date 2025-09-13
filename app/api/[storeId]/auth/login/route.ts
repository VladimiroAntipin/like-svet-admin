import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = 'nodejs';

// Durate dei token
const ACCESS_TOKEN_EXPIRES_IN = "1d"; 
const REFRESH_TOKEN_EXPIRES_IN = "30d";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
  const resolvedParams = await params;
  try {
    const { identifier, password } = await req.json();
    const { storeId } = resolvedParams;

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!identifier || !password) {
      return new NextResponse("Email/Phone and password are required", { status: 400 });
    }

    // 🔎 Trova utente per email o phone
    const user = await prismadb.customer.findFirst({
      where: {
        storeId,
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });

    if (!user) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    // 🔐 Confronta password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new NextResponse("Wrong password", { status: 401 });
    }

    // 🔑 Genera access token (15 min)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, storeId },
      process.env.JWT_SECRET as string,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    // 🔑 Genera refresh token (6 ore)
    const refreshToken = jwt.sign(
      { id: user.id, storeId },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    // Salva refresh token nel DB
    await prismadb.customer.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Prepara la response JSON
    const response = NextResponse.json({
      message: "Login successful",
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

    // Determina se siamo in produzione
    const IS_PROD = process.env.NODE_ENV === "production";

    // Cookie domain: in dev lascialo undefined, in prod metti il dominio principale
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      sameSite: "none",   // necessario per cross-site
      secure: IS_PROD,    // true solo in produzione
      domain: cookieDomain,
      maxAge: 60 * 60 * 24 * 30,
    });

    // Header aggiuntivo per gestione proxy/caching
    response.headers.set("Vary", "Origin");

    return response;
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}