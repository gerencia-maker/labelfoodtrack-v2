"use client";

import { useEffect, useState, use } from "react";

function playScanBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // First beep - high pitch
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "square";
    osc1.frequency.setValueAtTime(1800, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);

    // Second beep - confirmation tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(2400, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.2);

    // Cleanup
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Silent fallback — some browsers block audio without user interaction
  }
}

interface LabelData {
  productName: string;
  batch: string | null;
  netContent: string | null;
  productionDate: string | null;
  packedBy: string | null;
  destination: string | null;
  coldChain: string | null;
  expiryRefrigerated: string | null;
  expiryFrozen: string | null;
  expiryAmbient: string | null;
  product: {
    name: string;
    code: string;
    category: string | null;
    ingredients: string | null;
    allergens: string | null;
    storage: string | null;
    usage: string | null;
    refrigeratedDays: number;
    frozenDays: number;
    ambientDays: number;
  } | null;
  instance: {
    name: string;
    brandName: string | null;
    logoUrl: string | null;
  } | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const raw = dateStr.includes("T") ? dateStr : dateStr + "T00:00:00";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function QRLabelPage({
  params,
}: {
  params: Promise<{ batch: string }>;
}) {
  const { batch } = use(params);
  const [label, setLabel] = useState<LabelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    async function fetchLabel() {
      try {
        const res = await fetch(`/api/qr/${encodeURIComponent(batch)}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setLabel(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchLabel();
  }, [batch]);

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    playScanBeep();
  };

  // Auto-reveal after 2 seconds (fallback if user doesn't tap)
  useEffect(() => {
    if (label && !revealed) {
      const timer = setTimeout(() => {
        setRevealed(true);
        // Don't play sound on auto-reveal (no user interaction = blocked by browser)
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [label, revealed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-red-500">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-sm text-white/80 font-medium">Verificando etiqueta...</p>
        </div>
      </div>
    );
  }

  if (notFound || !label) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">
            Etiqueta no encontrada
          </h1>
          <p className="text-sm text-slate-500 max-w-sm">
            No se encontro una etiqueta con el lote{" "}
            <span className="font-mono font-medium text-slate-700">
              {decodeURIComponent(batch)}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Splash screen — tap to reveal with beep
  if (!revealed) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 cursor-pointer select-none"
        onClick={handleReveal}
        onTouchStart={handleReveal}
      >
        <div className="text-center space-y-6 px-6">
          {label.instance?.logoUrl && (
            <img
              src={label.instance.logoUrl}
              alt=""
              className="h-16 w-16 mx-auto rounded-2xl bg-white/20 object-contain p-2"
            />
          )}
          <div>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4 animate-pulse">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Etiqueta verificada</h1>
            <p className="text-white/70 text-sm">{label.productName}</p>
            <p className="text-white/50 text-xs font-mono mt-1">{label.batch}</p>
          </div>
          <p className="text-white/60 text-xs animate-bounce mt-8">Toca para ver detalles</p>
        </div>
      </div>
    );
  }

  const product = label.product;
  const instance = label.instance;
  const prodDate = label.productionDate || null;

  // Build cold chain info — only show the type that was selected on the label
  const cc = (label.coldChain || "").toLowerCase();
  const coldChainItems: {
    type: string;
    label: string;
    temp: string;
    days: number;
    expiry: string | null;
    color: string;
    bg: string;
    iconBg: string;
  }[] = [];
  if (product) {
    // Show refrigerated if label says "refrigerado" or "refrigerado / congelado"
    if (product.refrigeratedDays > 0 && (cc.includes("refrigerado") || cc.includes("refrigerated") || !label.coldChain))
      coldChainItems.push({
        type: "refrigerado",
        label: "Refrigerado",
        temp: "0 a 4 °C",
        days: product.refrigeratedDays,
        expiry: label.expiryRefrigerated || null,
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        iconBg: "bg-amber-100",
      });
    // Show frozen only if label explicitly says "congelado"
    if (product.frozenDays > 0 && (cc.includes("congelado") || cc.includes("frozen")))
      coldChainItems.push({
        type: "congelado",
        label: "Congelado",
        temp: "-18 a -22 °C",
        days: product.frozenDays,
        expiry: label.expiryFrozen || null,
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-200",
        iconBg: "bg-blue-100",
      });
    // Show ambient only if label says "ambiente"
    if (product.ambientDays > 0 && (cc.includes("ambiente") || cc.includes("ambient")))
      coldChainItems.push({
        type: "ambiente",
        label: "Ambiente",
        temp: "Temp. ambiente",
        days: product.ambientDays,
        expiry: label.expiryAmbient || null,
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        iconBg: "bg-emerald-100",
      });
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 overflow-hidden border border-slate-200/80">
          {/* Header with brand */}
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-6 py-5">
            <div className="flex items-center gap-4">
              {instance?.logoUrl && (
                <img
                  src={instance.logoUrl}
                  alt={instance.brandName || instance.name}
                  className="h-12 w-12 rounded-xl bg-white/20 object-contain p-1"
                />
              )}
              <div className="text-white">
                <h2 className="text-lg font-bold leading-tight">
                  {instance?.brandName || instance?.name || ""}
                </h2>
                {instance?.brandName && instance?.name && instance.brandName !== instance.name && (
                  <p className="text-sm text-white/70 mt-0.5">{instance.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Product name */}
          <div className="px-6 py-4 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900">
              {label.productName}
            </h1>
            {product?.category && (
              <span className="inline-block mt-1.5 rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700 uppercase tracking-wide">
                {product.category}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="px-6 py-4 space-y-4">
            {/* Batch & Production date */}
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Lote" value={label.batch || "--"} mono />
              <InfoItem
                label="Fecha de produccion"
                value={formatDate(prodDate)}
              />
            </div>

            {/* Cold chain */}
            {coldChainItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cadena de frio y vencimientos
                </p>
                <div className="space-y-2">
                  {coldChainItems.map((item) => (
                    <div
                      key={item.type}
                      className={`flex items-center justify-between rounded-xl border p-3 ${item.bg}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg}`}
                        >
                          {item.type === "refrigerado" && (
                            <svg
                              className="h-4 w-4 text-amber-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                              />
                            </svg>
                          )}
                          {item.type === "congelado" && (
                            <svg
                              className="h-4 w-4 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 3v18m-6-6l6 6 6-6M6 9l6-6 6 6"
                              />
                            </svg>
                          )}
                          {item.type === "ambiente" && (
                            <svg
                              className="h-4 w-4 text-emerald-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${item.color}`}>
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">{item.temp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.color}`}>
                          {item.expiry ? formatDate(item.expiry) : "--"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.days} dias
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Net content, Packed by, Destination */}
            <div className="grid grid-cols-2 gap-4">
              {label.netContent && (
                <InfoItem label="Contenido neto" value={label.netContent} />
              )}
              {label.packedBy && (
                <InfoItem label="Empacado por" value={label.packedBy} />
              )}
              {label.destination && (
                <InfoItem label="Destino" value={label.destination} />
              )}
            </div>

            {/* Ingredients */}
            {product?.ingredients && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ingredientes
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* Allergens */}
            {product?.allergens && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                  Alergenos
                </p>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-medium text-red-700">
                    {product.allergens}
                  </p>
                </div>
              </div>
            )}

            {/* Storage & Usage */}
            {(product?.storage || product?.usage) && (
              <div className="grid grid-cols-1 gap-3">
                {product?.storage && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Conservacion
                    </p>
                    <p className="text-sm text-slate-700">{product.storage}</p>
                  </div>
                )}
                {product?.usage && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Modo de uso
                    </p>
                    <p className="text-sm text-slate-700">{product.usage}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <svg
                className="h-4 w-4 text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6h.008v.008H6V6z"
                />
              </svg>
              <span>
                Etiqueta verificada por{" "}
                <span className="font-semibold text-orange-500">
                  LabelFoodTrack
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`text-sm font-medium text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
