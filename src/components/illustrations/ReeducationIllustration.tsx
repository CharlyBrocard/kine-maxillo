/**
 * Illustration flat de la rééducation fonctionnelle (page /specialites) :
 * salle de kiné — ballon, tapis, marche, haltères, espalier et élastique.
 * Couleurs de la palette du site (globals.css). Remplit son conteneur
 * (recadrage centré).
 */
export function ReeducationIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <svg
        viewBox="0 0 560 400"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label="Illustration : salle de rééducation avec ballon, haltères, marche et espalier"
      >
        <rect width="560" height="400" fill="#e7efea"/>
        <circle cx="260" cy="210" r="170" fill="#dbe8e1"/>
        {/* espalier */}
        <g fill="#c9dbd1">
          <rect x="390" y="40" width="12" height="282" rx="4"/>
          <rect x="498" y="40" width="12" height="282" rx="4"/>
        </g>
        <g stroke="#c9dbd1" strokeWidth="8" strokeLinecap="round">
          <path d="M402 70 H498"/><path d="M402 110 H498"/><path d="M402 150 H498"/><path d="M402 190 H498"/><path d="M402 230 H498"/><path d="M402 270 H498"/>
        </g>
        {/* élastique accroché */}
        <path d="M424 110 C414 170 470 200 474 110" fill="none" stroke="#c97b5a" strokeWidth="7" strokeLinecap="round"/>
        {/* sol */}
        <rect x="0" y="318" width="560" height="82" fill="#d3e2d9"/>
        {/* tapis */}
        <rect x="70" y="306" width="250" height="16" rx="8" fill="#3f6f63"/>
        {/* marche (step) */}
        <path d="M344 318 L358 284 L476 284 L490 318 Z" fill="#2b5248"/>
        <rect x="358" y="276" width="118" height="12" rx="6" fill="#3f6f63"/>
        {/* haltères posés sur la marche */}
        <g fill="#23312c">
          <rect x="390" y="256" width="56" height="8" rx="4"/>
          <rect x="380" y="244" width="14" height="32" rx="5"/>
          <rect x="442" y="244" width="14" height="32" rx="5"/>
        </g>
        {/* ballon */}
        <circle cx="200" cy="232" r="76" fill="#c97b5a"/>
        <path d="M130 214 Q200 186 270 214" fill="none" stroke="#f3e4dc" strokeWidth="8" strokeLinecap="round" opacity="0.7"/>
        <path d="M136 262 Q200 290 264 262" fill="none" stroke="#f3e4dc" strokeWidth="8" strokeLinecap="round" opacity="0.7"/>
        <circle cx="172" cy="196" r="12" fill="#ffffff" opacity="0.25"/>
        {/* plante */}
        <path d="M60 318 L68 270 L108 270 L116 318 Z" fill="#f3e4dc"/>
        <path d="M88 270 C80 230 60 220 52 196 C78 200 92 222 90 268" fill="#3f6f63"/>
        <path d="M88 270 C94 226 112 206 130 196 C128 226 108 246 90 270" fill="#2b5248"/>
        <path d="M88 270 C86 240 90 214 92 186" fill="none" stroke="#3f6f63" strokeWidth="4" strokeLinecap="round"/>
        {/* décor */}
        <g fill="#3f6f63" opacity="0.5"><circle cx="320" cy="70" r="5"/><circle cx="40" cy="140" r="4"/></g>
        <path d="M120 80 h16 M128 72 v16" stroke="#c97b5a" strokeWidth="4" strokeLinecap="round"/>
        <path d="M290 120 h14 M297 113 v14" stroke="#3f6f63" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
