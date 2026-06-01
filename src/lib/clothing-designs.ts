// Library sketsa SVG bawaan untuk seed `ClothingDesign`.
// Setiap sketsa dirancang ramping (single-side / outline-only) agar ringan saat dirasterize ke PNG
// untuk ditempel di bon produksi (10x15 cm). viewBox dijaga 0 0 200 320 supaya rasio sama.

export type BuiltinDesign = {
  code: string;
  name: string;
  description: string;
  category: string;
  genderTarget: "Pria" | "Wanita" | "Unisex";
  itemCode?: string; // jika ingin auto-link sebagai default item dengan code ini
  svg: string;
};

const VB = 'viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg"';
const STROKE = 'fill="none" stroke="#0f172a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';

export const BUILTIN_DESIGNS: BuiltinDesign[] = [
  {
    code: "CLN-PRIA-STD",
    name: "Celana Pria - Standar",
    description: "Celana panjang pria, saku samping lurus, tanpa karet",
    category: "Celana",
    genderTarget: "Pria",
    itemCode: "CLN",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M50 30 H150 V70 L165 310 H120 L100 110 L80 310 H35 L50 70 Z"/>
    <line x1="50" y1="70" x2="150" y2="70"/>
    <line x1="100" y1="30" x2="100" y2="70"/>
    <path d="M62 80 L80 95"/>
    <path d="M138 80 L120 95"/>
    <rect x="92" y="38" width="16" height="6" rx="1"/>
  </g>
</svg>`,
  },
  {
    code: "CLN-PRIA-MIRING",
    name: "Celana Pria - Saku Miring",
    description: "Celana panjang pria, saku samping miring",
    category: "Celana",
    genderTarget: "Pria",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M50 30 H150 V70 L165 310 H120 L100 110 L80 310 H35 L50 70 Z"/>
    <line x1="50" y1="70" x2="150" y2="70"/>
    <line x1="100" y1="30" x2="100" y2="70"/>
    <path d="M60 80 L85 105"/>
    <path d="M140 80 L115 105"/>
    <rect x="92" y="38" width="16" height="6" rx="1"/>
  </g>
</svg>`,
  },
  {
    code: "CLN-WNT-KARET",
    name: "Celana Wanita - Karet Pinggang",
    description: "Celana panjang wanita, karet di pinggang, saku samping",
    category: "Celana",
    genderTarget: "Wanita",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M50 30 H150 V70 L160 310 H120 L100 110 L80 310 H40 L50 70 Z"/>
    <path d="M50 30 Q60 38 50 46 Q60 54 50 62 Q60 70 50 70" stroke-dasharray="3 2"/>
    <path d="M150 30 Q140 38 150 46 Q140 54 150 62 Q140 70 150 70" stroke-dasharray="3 2"/>
    <path d="M52 38 H148" stroke-dasharray="2 2"/>
    <path d="M52 50 H148" stroke-dasharray="2 2"/>
    <path d="M52 62 H148" stroke-dasharray="2 2"/>
    <path d="M62 80 L82 100"/>
    <path d="M138 80 L118 100"/>
  </g>
</svg>`,
  },
  {
    code: "CLN-WNT-LURUS",
    name: "Celana Wanita - Saku Lurus",
    description: "Celana panjang wanita, model klasik, saku samping lurus",
    category: "Celana",
    genderTarget: "Wanita",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M55 30 H145 V70 L155 310 H115 L100 110 L85 310 H45 L55 70 Z"/>
    <line x1="55" y1="70" x2="145" y2="70"/>
    <line x1="100" y1="30" x2="100" y2="70"/>
    <path d="M62 80 L80 92"/>
    <path d="M138 80 L120 92"/>
  </g>
</svg>`,
  },
  {
    code: "KMJ-PRIA-LP",
    name: "Kemeja Pria - Lengan Panjang",
    description: "Kemeja pria lengan panjang, kerah standar, saku dada kiri",
    category: "Kemeja",
    genderTarget: "Pria",
    itemCode: "KMJ",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 40 L100 30 L130 40 L170 60 L160 110 L140 100 L140 290 H60 L60 100 L40 110 L30 60 Z"/>
    <path d="M85 40 L100 60 L115 40"/>
    <line x1="100" y1="60" x2="100" y2="290"/>
    <rect x="78" y="120" width="22" height="28"/>
    <circle cx="100" cy="90" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="130" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="170" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="210" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="250" r="1.5" fill="#0f172a"/>
  </g>
</svg>`,
  },
  {
    code: "KMJ-PRIA-LPD",
    name: "Kemeja Pria - Lengan Pendek",
    description: "Kemeja pria lengan pendek, kerah standar",
    category: "Kemeja",
    genderTarget: "Pria",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 40 L100 30 L130 40 L170 75 L150 100 L140 90 L140 280 H60 L60 90 L50 100 L30 75 Z"/>
    <path d="M85 40 L100 60 L115 40"/>
    <line x1="100" y1="60" x2="100" y2="280"/>
    <rect x="78" y="115" width="22" height="26"/>
    <circle cx="100" cy="90" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="130" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="170" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="220" r="1.5" fill="#0f172a"/>
  </g>
</svg>`,
  },
  {
    code: "KMJ-WNT",
    name: "Kemeja Wanita - Standar",
    description: "Kemeja/blus wanita, model pas badan, kerah biasa",
    category: "Kemeja",
    genderTarget: "Wanita",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 40 L100 30 L130 40 L165 60 L155 105 L138 95 Q142 180 130 290 H70 Q58 180 62 95 L45 105 L35 60 Z"/>
    <path d="M88 40 L100 58 L112 40"/>
    <line x1="100" y1="58" x2="100" y2="290"/>
    <circle cx="100" cy="88" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="125" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="165" r="1.5" fill="#0f172a"/>
    <circle cx="100" cy="205" r="1.5" fill="#0f172a"/>
  </g>
</svg>`,
  },
  {
    code: "JAS-PRIA",
    name: "Jas Pria",
    description: "Jas formal pria, dua kancing, kerah notch lapel",
    category: "Jas",
    genderTarget: "Pria",
    itemCode: "JAS",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 40 L100 30 L130 40 L175 65 L160 130 L140 115 L140 285 H60 L60 115 L40 130 L25 65 Z"/>
    <path d="M85 45 L100 70 L115 45"/>
    <path d="M100 70 L75 110 L80 285"/>
    <path d="M100 70 L125 110 L120 285"/>
    <path d="M75 110 L100 130 L125 110"/>
    <rect x="63" y="180" width="28" height="22"/>
    <rect x="109" y="180" width="28" height="22"/>
    <circle cx="105" cy="155" r="2"/>
    <circle cx="105" cy="195" r="2"/>
  </g>
</svg>`,
  },
  {
    code: "GAMIS",
    name: "Gamis",
    description: "Gamis wanita panjang, lengan panjang",
    category: "Gamis",
    genderTarget: "Wanita",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 40 L100 30 L130 40 L165 60 L155 110 L138 100 L155 300 H45 L62 100 L45 110 L35 60 Z"/>
    <path d="M88 40 L100 58 L112 40"/>
    <line x1="100" y1="58" x2="100" y2="300"/>
  </g>
</svg>`,
  },
  {
    code: "ROK-STD",
    name: "Rok - Standar",
    description: "Rok wanita selutut",
    category: "Rok",
    genderTarget: "Wanita",
    itemCode: "ROK",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M60 60 H140 L160 280 H40 Z"/>
    <line x1="60" y1="60" x2="140" y2="60"/>
    <line x1="100" y1="60" x2="100" y2="280"/>
  </g>
</svg>`,
  },
  {
    code: "BLAZER",
    name: "Blazer",
    description: "Blazer formal unisex, satu kancing",
    category: "Jas",
    genderTarget: "Unisex",
    itemCode: "BLAZER",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 40 L100 30 L130 40 L170 65 L158 125 L140 115 L140 280 H60 L60 115 L42 125 L30 65 Z"/>
    <path d="M85 45 L100 70 L115 45"/>
    <path d="M100 70 L78 115 L85 280"/>
    <path d="M100 70 L122 115 L115 280"/>
    <rect x="65" y="190" width="26" height="20"/>
    <rect x="109" y="190" width="26" height="20"/>
    <circle cx="103" cy="160" r="2"/>
  </g>
</svg>`,
  },
  {
    code: "KAOS",
    name: "Kaos",
    description: "Kaos lengan pendek unisex",
    category: "Kaos",
    genderTarget: "Unisex",
    svg: `<svg ${VB}>
  <g ${STROKE}>
    <path d="M70 50 Q85 35 100 35 Q115 35 130 50 L170 80 L150 105 L140 95 L140 280 H60 L60 95 L50 105 L30 80 Z"/>
    <path d="M85 45 Q100 60 115 45"/>
  </g>
</svg>`,
  },
];
