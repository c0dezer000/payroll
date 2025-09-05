import prisma from "../../../src/server/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const users = await prisma.users.findMany({ select: { id: true, name: true, email: true, role: true, created_at: true, updated_at: true, avatar: true } });
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;
    if (!email || !password || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 10);

    const created = await prisma.users.create({ data: { name, email, password_hash, role: role || "Admin" } });
    return NextResponse.json({ user: { id: created.id, name: created.name, email: created.email, role: created.role } }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, password, role } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const data: any = { name, email, role };
    if (password) {
      data.password_hash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.users.update({ where: { id }, data });
    return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.users.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
