import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { hasActionPermission } from "@/lib/permissions";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  if (!hasActionPermission(user.role, user.permisos, "configuration", "editar_instancia")) {
    return forbidden();
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: "Cloudinary no esta configurado" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo debe ser menor a 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "labelfoodtrack/logos",
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
