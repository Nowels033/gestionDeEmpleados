import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        securityUser: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastName: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Error al obtener activos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const asset = await prisma.asset.create({
      data: {
        name: body.name,
        description: body.description,
        serialNumber: body.serialNumber,
        brand: body.brand,
        model: body.model,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        currentValue: body.currentValue ? parseFloat(body.currentValue) : null,
        location: body.location,
        qrCode: body.qrCode,
        ensLevel: body.ensLevel || "BASIC",
        categoryId: body.categoryId,
        securityUserId: body.securityUserId,
      },
      include: {
        category: true,
        securityUser: true,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Error al crear activo" },
      { status: 500 }
    );
  }
}
