// sRGB D65 → CIELAB → CIEDE2000. Screen references still cannot predict physical materials.
const radians = Math.PI / 180;

export function hexToRgb(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new TypeError('color must be a six-digit HEX value such as #E8A0B0');
  }
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));
}

export function rgbToLab(rgb) {
  const [r, g, b] = rgb.map(value => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const xyz = [
    (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047,
    0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883,
  ].map(value => value > 0.008856451679 ? Math.cbrt(value) : 7.787037037 * value + 16 / 116);
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}

export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const meanC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(meanC ** 7 / (meanC ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hue = (a, b) => (Math.atan2(b, a) / radians + 360) % 360;
  const h1 = hue(ap1, b1), h2 = hue(ap2, b2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = h2 - h1;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh * radians / 2);
  const meanL = (L1 + L2) / 2, meanCp = (Cp1 + Cp2) / 2;
  let meanH = h1 + h2;
  if (Cp1 * Cp2 === 0) meanH /= 2;
  else if (Math.abs(h1 - h2) <= 180) meanH /= 2;
  else meanH = (meanH + (meanH < 360 ? 360 : -360)) / 2;
  const T = 1 - 0.17 * Math.cos((meanH - 30) * radians)
    + 0.24 * Math.cos(2 * meanH * radians)
    + 0.32 * Math.cos((3 * meanH + 6) * radians)
    - 0.20 * Math.cos((4 * meanH - 63) * radians);
  const dTheta = 30 * Math.exp(-(((meanH - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(meanCp ** 7 / (meanCp ** 7 + 25 ** 7));
  const Sl = 1 + 0.015 * (meanL - 50) ** 2 / Math.sqrt(20 + (meanL - 50) ** 2);
  const Sc = 1 + 0.045 * meanCp, Sh = 1 + 0.015 * meanCp * T;
  const Rt = -Math.sin(2 * dTheta * radians) * Rc;
  const x = dL / Sl, y = dC / Sc, z = dH / Sh;
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2 + Rt * y * z);
}
