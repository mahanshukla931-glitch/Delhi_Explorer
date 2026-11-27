import { NextRequest, NextResponse } from "next/server";
import { StoredShape } from "@/lib/shapesStorage";

export const dynamic = "force-dynamic";

// Server-side in-memory DB store for drawn shapes
let shapesDatabase: StoredShape[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: shapesDatabase.length,
    shapes: shapesDatabase,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shape: StoredShape = body.shape;

    if (!shape || !shape.id || !shape.type) {
      return NextResponse.json(
        { error: "Invalid shape data" },
        { status: 400 }
      );
    }

    // Upsert into server DB
    const existingIndex = shapesDatabase.findIndex((s) => s.id === shape.id);
    if (existingIndex >= 0) {
      shapesDatabase[existingIndex] = shape;
    } else {
      shapesDatabase.push(shape);
    }

    return NextResponse.json({
      success: true,
      message: "Shape saved successfully",
      shape,
      totalCount: shapesDatabase.length,
    });
  } catch (err) {
    console.error("Save shape API error:", err);
    return NextResponse.json(
      { error: "Failed to persist shape" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id === "all") {
      shapesDatabase = [];
      return NextResponse.json({ success: true, message: "All shapes cleared" });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing shape id" }, { status: 400 });
    }

    shapesDatabase = shapesDatabase.filter((s) => s.id !== id);

    return NextResponse.json({
      success: true,
      message: "Shape deleted successfully",
      totalCount: shapesDatabase.length,
    });
  } catch (err) {
    console.error("Delete shape API error:", err);
    return NextResponse.json(
      { error: "Failed to delete shape" },
      { status: 500 }
    );
  }
}
