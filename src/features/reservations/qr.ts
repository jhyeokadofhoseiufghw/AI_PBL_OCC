import "server-only";

import QRCode from "qrcode";

export async function generateQrDataUrl(token: string) {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 4,
    scale: 10,
    type: "image/png",
  });
}
