import { useRef, useCallback } from "react";

interface QRPagoProps {
  importe: number;
  concepto: string;
  nombreNegocio?: string;
  size?: number;
  showDownload?: boolean;
  compact?: boolean;
}

function buildQRUrl(importe: number, concepto: string, size: number): string {
  // Formato estándar para transferencias/Bizum — texto legible por humanos y apps
  // Usamos formato simple y corto para maximizar compatibilidad de lectores
  const conceptoCorto = concepto.substring(0, 30).replace(/[^a-zA-Z0-9 áéíóúÁÉÍÓÚñÑ]/g, "");
  const data = `Bizum: 614976736\nImporte: ${importe}EUR\nConcepto: ${conceptoCorto}`;
  const encoded = encodeURIComponent(data);
  // Fondo blanco puro, módulos negros — estándar ISO 18004
  // ecc=M (15% corrección) — suficiente para logo pequeño y mejor densidad de módulos
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=000000&margin=20&qzone=3&ecc=M`;
}

export default function QRPago({
  importe,
  concepto,
  nombreNegocio = "NEXURA",
  size = 180,
  showDownload = true,
  compact = false,
}: QRPagoProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleDownload = useCallback(async () => {
    const qrUrl = buildQRUrl(importe, concepto, 400);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-pago-${concepto.replace(/\s+/g, "-")}-${importe}EUR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, "_blank");
    }
  }, [importe, concepto]);

  const qrUrl = buildQRUrl(importe, concepto, size);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative rounded-xl overflow-hidden bg-white p-1" style={{ width: size + 8, height: size + 8 }}>
          <img
            ref={imgRef}
            src={qrUrl}
            alt={`QR pago ${importe}€`}
            className="w-full h-full object-contain"
            style={{ width: size, height: size }}
          />
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-stone-800">{importe}€</div>
          <div className="text-xs text-stone-400 truncate max-w-[120px]">{concepto}</div>
        </div>
        {showDownload && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 cursor-pointer transition-colors whitespace-nowrap"
          >
            <i className="ri-download-line text-xs"></i> Descargar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-stone-900 rounded-2xl p-5 flex flex-col items-center gap-3">
      {/* Header */}
      <div className="text-center">
        <div className="text-white font-bold text-sm">{nombreNegocio}</div>
        <div className="text-stone-400 text-xs">Escanea para pagar</div>
      </div>

      {/* QR — sin logo encima para máxima legibilidad */}
      <div className="rounded-xl overflow-hidden bg-white p-2" style={{ width: size + 16, height: size + 16 }}>
        <img
          ref={imgRef}
          src={qrUrl}
          alt={`QR pago ${importe}€`}
          className="w-full h-full object-contain"
          style={{ width: size, height: size }}
        />
      </div>

      {/* Importe */}
      <div className="text-center">
        <div className="text-white font-bold text-2xl">{importe.toLocaleString("es-ES")}€</div>
        <div className="text-stone-400 text-xs mt-0.5 truncate max-w-[160px]">{concepto}</div>
      </div>

      {/* Info Bizum */}
      <div className="w-full bg-stone-800 rounded-xl px-4 py-2.5 text-center">
        <div className="text-stone-400 text-xs mb-0.5">Bizum al número</div>
        <div className="text-white font-mono font-bold text-sm">614 976 736</div>
      </div>

      {/* Descarga */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
        >
          <i className="ri-download-line"></i>
          Descargar QR para imprimir
        </button>
      )}
    </div>
  );
}
