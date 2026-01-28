const fs = require('fs');

// Simple 16x16 purple gradient PNG with T
// This is a minimal valid PNG file
function createSimplePNG(size) {
  // PNG header + IHDR + IDAT + IEND chunks
  // Creating a simple solid purple icon
  
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);   // height
  ihdrData.writeUInt8(8, 8);           // bit depth
  ihdrData.writeUInt8(6, 9);           // color type (RGBA)
  ihdrData.writeUInt8(0, 10);          // compression
  ihdrData.writeUInt8(0, 11);          // filter
  ihdrData.writeUInt8(0, 12);          // interlace
  
  const ihdrCRC = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),  // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCRC
  ]);
  
  // Create image data - simple purple gradient
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Gradient from #667eea to #764ba2
      const t = (x + y) / (width + height - 2);
      const r = Math.round(102 + (118 - 102) * t);
      const g = Math.round(126 + (75 - 126) * t);
      const b = Math.round(234 + (162 - 234) * t);
      
      // Add T letter (simple rectangle pattern in center)
      const centerX = width / 2;
      const centerY = height / 2;
      const letterSize = width * 0.4;
      
      let isT = false;
      // Horizontal bar of T
      if (Math.abs(y - centerY + letterSize * 0.3) < letterSize * 0.15 &&
          Math.abs(x - centerX) < letterSize * 0.5) {
        isT = true;
      }
      // Vertical bar of T
      if (y > centerY - letterSize * 0.15 && y < centerY + letterSize * 0.5 &&
          Math.abs(x - centerX) < letterSize * 0.15) {
        isT = true;
      }
      
      if (isT) {
        rawData.push(255, 255, 255, 255); // White T
      } else {
        rawData.push(r, g, b, 255); // Gradient background
      }
    }
  }
  
  const rawBuffer = Buffer.from(rawData);
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawBuffer);
  
  const idatCRC = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  const idatLengthBuf = Buffer.alloc(4);
  idatLengthBuf.writeUInt32BE(compressed.length, 0);
  const idatChunk = Buffer.concat([
    idatLengthBuf,
    Buffer.from('IDAT'),
    compressed,
    idatCRC
  ]);
  
  // IEND chunk
  const iendCRC = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    iendCRC
  ]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  const result = Buffer.alloc(4);
  result.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0, 0);
  return result;
}

fs.writeFileSync('icon16.png', createSimplePNG(16));
fs.writeFileSync('icon48.png', createSimplePNG(48));
fs.writeFileSync('icon128.png', createSimplePNG(128));
console.log('Icons created successfully!');
