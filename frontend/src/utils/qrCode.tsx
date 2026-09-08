import React from 'react';

/**
 * Pure TypeScript QR Code Generator (Model 2, Byte Mode, Zero Dependencies)
 * Generates an SVG string or matrix for any text payload.
 */

// GF(2^8) Galois Field arithmetic for Reed-Solomon Error Correction
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val <<= 1;
    if (val & 256) {
      val ^= 0x11d; // 285 polynomial
    }
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsComputePoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP_TABLE[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculate(data: Uint8Array, ecCount: number): Uint8Array {
  const genPoly = rsComputePoly(ecCount);
  const remainder = new Uint8Array(ecCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(genPoly[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMul(genPoly[ecCount], factor);
  }
  return remainder;
}

// QR Code Specifications: [Version, Total Modules, Total Codewords, EC Codewords per block, Blocks]
// For Level M error correction
interface VersionInfo {
  version: number;
  size: number;
  totalCodewords: number;
  ecPerBlock: number;
  numBlocksGroup1: number;
  dataCodewordsGroup1: number;
  numBlocksGroup2: number;
  dataCodewordsGroup2: number;
  alignmentPatterns: number[];
}

const VERSIONS: VersionInfo[] = [
  { version: 1, size: 21, totalCodewords: 26, ecPerBlock: 10, numBlocksGroup1: 1, dataCodewordsGroup1: 16, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [] },
  { version: 2, size: 25, totalCodewords: 44, ecPerBlock: 16, numBlocksGroup1: 1, dataCodewordsGroup1: 28, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecPerBlock: 26, numBlocksGroup1: 1, dataCodewordsGroup1: 44, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecPerBlock: 18, numBlocksGroup1: 2, dataCodewordsGroup1: 32, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 26] },
  { version: 5, size: 37, totalCodewords: 134, ecPerBlock: 24, numBlocksGroup1: 2, dataCodewordsGroup1: 43, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 30] },
  { version: 6, size: 41, totalCodewords: 172, ecPerBlock: 16, numBlocksGroup1: 4, dataCodewordsGroup1: 27, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 34] },
  { version: 7, size: 45, totalCodewords: 196, ecPerBlock: 18, numBlocksGroup1: 4, dataCodewordsGroup1: 31, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 22, 38] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(text);
  const dataLen = utf8.length;

  // Determine smallest version
  let targetVer: VersionInfo | null = null;
  for (const v of VERSIONS) {
    const cap = (v.numBlocksGroup1 * v.dataCodewordsGroup1) + (v.numBlocksGroup2 * v.dataCodewordsGroup2);
    // Header overhead: 4 bits mode + 8 bits length (for ver 1-9 byte mode) = 12 bits -> 2-3 bytes
    if (cap >= dataLen + 3) {
      targetVer = v;
      break;
    }
  }

  if (!targetVer) {
    // If text is very long, use highest supported version in our table or trim
    targetVer = VERSIONS[VERSIONS.length - 1];
  }

  const totalDataBytes = (targetVer.numBlocksGroup1 * targetVer.dataCodewordsGroup1) + 
                         (targetVer.numBlocksGroup2 * targetVer.dataCodewordsGroup2);

  // Build bit stream
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for version 1-9)
  pushBits(Math.min(dataLen, 255), 8);
  // Data bytes
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Pad to 8-bit boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes: 0xEC, 0x11
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    dataCodewords[i] = byteVal;
  }

  // Split into blocks and compute Reed-Solomon EC
  const blocks: { data: Uint8Array; ec: Uint8Array }[] = [];
  let offset = 0;

  for (let i = 0; i < targetVer.numBlocksGroup1; i++) {
    const slice = dataCodewords.slice(offset, offset + targetVer.dataCodewordsGroup1);
    offset += targetVer.dataCodewordsGroup1;
    blocks.push({
      data: slice,
      ec: rsCalculate(slice, targetVer.ecPerBlock),
    });
  }

  // Interleave data codewords
  const interleaved: number[] = [];
  const maxDataLen = targetVer.dataCodewordsGroup1;
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blocks) {
      if (i < b.data.length) interleaved.push(b.data[i]);
    }
  }
  // Interleave error correction codewords
  for (let i = 0; i < targetVer.ecPerBlock; i++) {
    for (const b of blocks) {
      interleaved.push(b.ec[i]);
    }
  }

  // Prepare matrix
  const size = targetVer.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunctionModule(r: number, c: number, val: boolean) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  }

  // Finder Patterns (7x7 at top-left, top-right, bottom-left)
  function placeFinder(top: number, left: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setFunctionModule(top + r, left + c, isBorder || isCenter);
      }
    }
    // Separator around finder pattern
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setFunctionModule(top + r, left + c, false);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    setFunctionModule(6, i, val);
    setFunctionModule(i, 6, val);
  }

  // Alignment patterns
  const alignCoords = targetVer.alignmentPatterns;
  if (alignCoords.length > 0) {
    for (const r of alignCoords) {
      for (const c of alignCoords) {
        // Skip if overlaps with finder patterns
        const nearTopLeft = r < 9 && c < 9;
        const nearTopRight = r < 9 && c > size - 9;
        const nearBottomLeft = r > size - 9 && c < 9;
        if (!nearTopLeft && !nearTopRight && !nearBottomLeft) {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const border = Math.abs(dy) === 2 || Math.abs(dx) === 2;
              const center = dy === 0 && dx === 0;
              setFunctionModule(r + dy, c + dx, border || center);
            }
          }
        }
      }
    }
  }

  // Dark module
  setFunctionModule(4 * targetVer.version + 9, 8, true);

  // Reserve format information area
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  // Place data bits in matrix (up and down 2-column zigzag)
  const allBits: number[] = [];
  for (const byte of interleaved) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((byte >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing pattern column

    const rowRange = upwards
      ? Array.from({ length: size }, (_, idx) => size - 1 - idx)
      : Array.from({ length: size }, (_, idx) => idx);

    for (const r of rowRange) {
      for (let c = right; c >= right - 1; c--) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          matrix[r][c] = bit === 1;
        }
      }
    }
    upwards = !upwards;
  }

  // Masking (Pattern 0: (row + col) % 2 === 0)
  // Format Info for Level M + Mask 0: 101010000010010
  const formatInfo = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        // Apply mask pattern (r + c) % 2 === 0
        if ((r + c) % 2 === 0) {
          matrix[r][c] = !matrix[r][c];
        }
      }
    }
  }

  // Place format info bits
  // Top-left area
  for (let i = 0; i < 6; i++) matrix[8][i] = formatInfo[i] === 1;
  matrix[8][7] = formatInfo[6] === 1;
  matrix[8][8] = formatInfo[7] === 1;
  matrix[7][8] = formatInfo[8] === 1;
  for (let i = 0; i < 6; i++) matrix[5 - i][8] = formatInfo[9 + i] === 1;

  // Split copies near edges
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatInfo[i] === 1;
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatInfo[7 + i] === 1;

  return matrix.map(row => row.map(cell => cell === true));
}

/**
 * Reusable React SVG Component for rendering Telegram-style bold QR Codes:
 * - Bold rounded squircle data dots (high contrast, crisp fill)
 * - Bold squircle finder eyes in 3 corners
 * - Center avatar / logo cutout
 * - Solid black color
 */
export function QRCodeSVG({
  value,
  size = 220,
  fgColor = '#000000',
  bgColor = '#ffffff',
  logoUrl,
  className = '',
}: {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string;
  className?: string;
}) {
  const matrix = generateQrMatrix(value);
  const moduleCount = matrix.length;
  const padding = 2; // quiet zone
  const totalGrid = moduleCount + padding * 2;
  const center = padding + moduleCount / 2;
  const hasLogo = Boolean(logoUrl);
  // Center logo radius in module grid units
  const logoRadius = hasLogo ? Math.min(moduleCount * 0.16, 3.2) : 0;
  const clipId = `qr-logo-clip-${moduleCount}`;

  // Helper to test if a module is part of the 3 corner finder eyes (7x7)
  const isFinderEye = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= moduleCount - 7;
    const inBottomLeft = r >= moduleCount - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  // Helper to test if module is within center logo zone
  const isInLogoZone = (r: number, c: number) => {
    if (!hasLogo) return false;
    const dist = Math.hypot((c + padding + 0.5) - center, (r + padding + 0.5) - center);
    return dist <= logoRadius + 0.45;
  };

  // 1. Data Dots (Rendered as bold, rounded squircle modules)
  const dots: React.ReactElement[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c] && !isFinderEye(r, c) && !isInLogoZone(r, c)) {
        dots.push(
          <rect
            key={`${r}-${c}`}
            x={c + padding + 0.05}
            y={r + padding + 0.05}
            width={0.90}
            height={0.90}
            rx={0.32}
            fill={fgColor}
          />
        );
      }
    }
  }

  // 2. Corner Finder Eyes (Bold Telegram-style rounded squircle frames & pupils)
  const finderPositions = [
    { x: 0, y: 0 },
    { x: moduleCount - 7, y: 0 },
    { x: 0, y: moduleCount - 7 },
  ];

  const finderEyes = finderPositions.map((pos, idx) => {
    const eyeX = pos.x + padding;
    const eyeY = pos.y + padding;
    return (
      <g key={`finder-${idx}`}>
        {/* Bold outer squircle frame */}
        <rect
          x={eyeX + 0.6}
          y={eyeY + 0.6}
          width={5.8}
          height={5.8}
          rx={1.8}
          fill="none"
          stroke={fgColor}
          strokeWidth={1.2}
        />
        {/* Bold inner pupil */}
        <rect
          x={eyeX + 1.9}
          y={eyeY + 1.9}
          width={3.2}
          height={3.2}
          rx={1.1}
          fill={fgColor}
        />
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${totalGrid} ${totalGrid}`}
      width={size}
      height={size}
      className={`rounded-[22px] overflow-hidden ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {hasLogo && (
        <defs>
          <clipPath id={clipId}>
            <circle cx={center} cy={center} r={logoRadius} />
          </clipPath>
        </defs>
      )}

      {/* Clean Background */}
      <rect width={totalGrid} height={totalGrid} fill={bgColor} rx={2.5} />

      {/* Bold Finder Patterns */}
      {finderEyes}

      {/* Bold Liquid Data Modules */}
      {dots}

      {/* Center Logo / Avatar Badge */}
      {hasLogo && (
        <g>
          {/* Outer White Halo */}
          <circle
            cx={center}
            cy={center}
            r={logoRadius + 0.65}
            fill={bgColor}
          />
          {/* Subtle Border */}
          <circle
            cx={center}
            cy={center}
            r={logoRadius + 0.1}
            fill="none"
            stroke={fgColor}
            strokeWidth={0.3}
            opacity={0.35}
          />
          {/* Image */}
          <image
            href={logoUrl}
            x={center - logoRadius}
            y={center - logoRadius}
            width={logoRadius * 2}
            height={logoRadius * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      )}
    </svg>
  );
}
