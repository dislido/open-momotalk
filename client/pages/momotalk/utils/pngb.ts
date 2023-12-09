// wip

/* Table of CRCs of all 8-bit messages. */
const crc_table = new Uint32Array(256);

/* Flag: has the table been computed? Initially false. */
let crcTableComputed = 0;

/* Make the table for a fast CRC. */
function makeCrcTable() {
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else c = c >>> 1;
    }
    crc_table[n] = c;
  }
  crcTableComputed = 1;
}

function crc(data: Uint8Array) {
  let c = 0xffffffff;
  if (!crcTableComputed) makeCrcTable();
  for (const it of data) {
    c = crc_table[(c ^ it) & 0xff] ^ (c >>> 8);
  }
  /* 大端序 */
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setInt32(0, c ^ 0xffffffff, false);
  return new Uint8Array(buffer);
}

function createPngThunk(type: string, data?: Uint8Array) {
  const dataLength = data?.length ?? 0;
  const buf = new ArrayBuffer(12 + dataLength);
  const bufDv = new DataView(buf);
  bufDv.setUint32(0, dataLength, false);
  bufDv.setUint8(4, type.codePointAt(0) ?? 0);
  bufDv.setUint8(5, type.codePointAt(1) ?? 0);
  bufDv.setUint8(6, type.codePointAt(2) ?? 0);
  bufDv.setUint8(7, type.codePointAt(3) ?? 0);
  const u8Arr = new Uint8Array(buf);
  if (data?.length) {
    u8Arr.set(data, 8);
  }
  const crcData = crc(u8Arr.slice(4, dataLength + 8));
  u8Arr.set(crcData, dataLength + 8);
  return u8Arr;
}

/** 创建一个指定宽高的透明占位图片, https://www.w3.org/TR/png/ */
export async function placeholderImg(width: number, height: number) {
  const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const chunks: Uint8Array[] = [];
  const ihdrBuf = new ArrayBuffer(13);
  const ihdrBufDv = new DataView(ihdrBuf);
  ihdrBufDv.setUint32(0, width);
  ihdrBufDv.setUint32(4, height);
  ihdrBufDv.setUint8(8, 8);
  ihdrBufDv.setUint8(9, 6);
  ihdrBufDv.setUint8(10, 0);
  ihdrBufDv.setUint8(11, 0);
  ihdrBufDv.setUint8(12, 0);
  chunks.push(createPngThunk('IHDR', new Uint8Array(ihdrBuf)));

  const compression = new CompressionStream('deflate');
  const writer = compression.writable.getWriter();
  await writer.write(new Uint8Array(width * height * 4));
  await writer.close();
  const compressed = await new Response(compression.readable).arrayBuffer();
  chunks.push(createPngThunk('IDAT', new Uint8Array(compressed)));

  chunks.push(createPngThunk('IEND'));
  const result = new Uint8Array(header.length + chunks.reduce((len, cnk) => len + cnk.length, 0));
  let cursor = header.length;
  result.set(header, 0);
  chunks.forEach((cnk) => {
    result.set(cnk, cursor);
    cursor += cnk.length;
  });
  return result;
}
