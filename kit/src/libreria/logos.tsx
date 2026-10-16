// Logo de ejemplo: tres barras que suben dentro de un círculo. Cámbialo por el tuyo desde src/marca.ts (LOGO.archivo)
// o reemplaza este componente: el resto de la librería solo usa `LogoMarca`.
import React from "react";
import { Img, staticFile } from "remotion";
import { MARCA } from "./paletas";

const BARRAS = [
  { x: 300, h: 260 },
  { x: 462, h: 400 },
  { x: 624, h: 540 },
];

/**
 * `entrada`: avance 0→1 de cada barra (suben desde abajo). `circulo`: fondo redondo o cuadrito redondeado.
 * Si `MARCA.logo` tiene un archivo, se muestra esa imagen (las barras y la entrada se ignoran).
 */
export const LogoMarca: React.FC<{ size: number; fondo?: string; color?: string; entrada?: number[]; circulo?: boolean }> = ({ size, fondo = MARCA.obs, color = MARCA.crema, entrada = [1, 1, 1], circulo = true }) => {
  if (MARCA.logo) {
    return <Img src={staticFile(MARCA.logo)} style={{ width: size, height: size, borderRadius: circulo ? size / 2 : size * 0.22, objectFit: "cover" }} />;
  }
  const base = 770;
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" rx={circulo ? 512 : 230} fill={fondo} />
      {BARRAS.map(({ x, h }, i) => {
        const k = Math.max(0, Math.min(1, entrada[i] ?? 1));
        const alto = Math.max(1, h * k);
        return <rect key={i} x={x - 50} y={base - alto} width={100} height={alto} rx={50} fill={i === 2 ? MARCA.dorado : color} opacity={Math.min(1, k * 2)} />;
      })}
    </svg>
  );
};
