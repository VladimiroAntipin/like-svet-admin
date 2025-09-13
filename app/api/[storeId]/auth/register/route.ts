import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, { params }: any) {
  const resolvedParams = await params;
  const { storeId } = resolvedParams;

  try {
    const { firstName, lastName, birthDate, email, phone, password } = await req.json();

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!firstName || !lastName || !birthDate || !email || !password || !phone) {
      return new NextResponse("All fields are required", { status: 400 });
    }

    // 🔎 check se esiste già email o telefono nello stesso store
    const existingUser = await prismadb.customer.findFirst({
      where: {
        storeId,
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existingUser) {
      return new NextResponse("Пользователь с этим email/номером телефона уже существует", { status: 400 });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prismadb.customer.create({
      data: {
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        email,
        phone,
        password: hashedPassword,
        storeId,
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
      },
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
