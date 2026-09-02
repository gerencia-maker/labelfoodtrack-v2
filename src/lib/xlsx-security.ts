const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_FILE = 0x02014b50;
const MAX_ARCHIVE_ENTRIES = 1_000;
const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;

/**
 * Inspect XLSX ZIP metadata before decompression. This rejects encrypted,
 * ZIP64, malformed, or excessively compressed archives before ExcelJS loads them.
 */
export function validateXlsxArchive(buffer: Buffer): boolean {
  if (buffer.length < 22) return false;

  const searchStart = Math.max(0, buffer.length - 65_557);
  let eocdOffset = -1;
  for (let offset = buffer.length - 22; offset >= searchStart; offset--) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) return false;

  const diskNumber = buffer.readUInt16LE(eocdOffset + 4);
  const centralDisk = buffer.readUInt16LE(eocdOffset + 6);
  const entries = buffer.readUInt16LE(eocdOffset + 10);
  const centralSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (diskNumber !== 0 || centralDisk !== 0 || entries === 0 || entries > MAX_ARCHIVE_ENTRIES) {
    return false;
  }
  if (
    entries === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff ||
    centralOffset + centralSize > buffer.length
  ) {
    return false;
  }

  let cursor = centralOffset;
  let compressedTotal = 0;
  let uncompressedTotal = 0;

  for (let index = 0; index < entries; index++) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_FILE) {
      return false;
    }

    const flags = buffer.readUInt16LE(cursor + 8);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);

    if ((flags & 0x1) !== 0 || compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      return false;
    }

    compressedTotal += compressedSize;
    uncompressedTotal += uncompressedSize;
    if (uncompressedTotal > MAX_UNCOMPRESSED_BYTES) return false;

    cursor += 46 + fileNameLength + extraLength + commentLength;
    if (cursor > centralOffset + centralSize || cursor > buffer.length) return false;
  }

  if (compressedTotal === 0) return uncompressedTotal === 0;
  return uncompressedTotal / compressedTotal <= MAX_COMPRESSION_RATIO;
}

