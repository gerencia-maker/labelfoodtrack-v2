import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized, forbidden } from "@/lib/auth";
import { hasActionPermission } from "@/lib/permissions";
import { v2 as cloudinary } from "cloudinary";
import { enforceRateLimit } from "@/lib/rate-limit";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function hasValidImageSignature(buffer: Buffer): boolean {
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg =
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return isPng || isJpeg || isWebp;
}

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

  const limited = enforceRateLimit(request, {
    scope: "image-upload",
    identifier: user.id,
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  if (!user.instanceId && !user.isSuperAdmin) {
    return NextResponse.json({ error: "Seleccione una instancia primero" }, { status: 400 });
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

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imagenes PNG, JPEG o WebP" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo debe ser menor a 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!hasValidImageSignature(buffer)) {
      return NextResponse.json({ error: "El contenido del archivo no es una imagen valida" }, { status: 400 });
    }

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
