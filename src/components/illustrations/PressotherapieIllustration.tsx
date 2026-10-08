/**
 * Illustration flat de la pressothérapie (page /specialites) : bottes à
 * compartiments reliées à leur boîtier de commande.
 * Couleurs de la palette du site (globals.css). Remplit son conteneur
 * (recadrage centré).
 */
export function PressotherapieIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <svg
        viewBox="0 0 560 350"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label="Illustration : bottes de pressothérapie reliées à leur boîtier"
      >
        <rect width="560" height="350" fill="#f3e4dc"/>
        <circle cx="250" cy="175" r="150" fill="#ecd6ca"/>
        <rect x="0" y="296" width="560" height="54" fill="#e8d0c3"/>
        {/* botte gauche */}
        <g>
          <path d="M134 208 H182 Q200 208 200 226 V258 H236 Q256 258 256 278 V280 Q256 300 236 300 H134 Q116 300 116 282 V226 Q116 208 134 208 Z" fill="#3f6f63"/>
          <rect x="116" y="52" width="84" height="44" rx="18" fill="#3f6f63"/>
          <rect x="116" y="102" width="84" height="44" rx="18" fill="#3f6f63"/>
          <rect x="116" y="152" width="84" height="44" rx="18" fill="#3f6f63"/>
        </g>
        {/* botte droite */}
        <g>
          <path d="M288 208 H336 Q354 208 354 226 V258 H390 Q410 258 410 278 V280 Q410 300 390 300 H288 Q270 300 270 282 V226 Q270 208 288 208 Z" fill="#5d8a7d"/>
          <rect x="270" y="52" width="84" height="44" rx="18" fill="#5d8a7d"/>
          <rect x="270" y="102" width="84" height="44" rx="18" fill="#5d8a7d"/>
          <rect x="270" y="152" width="84" height="44" rx="18" fill="#5d8a7d"/>
        </g>
        {/* tuyaux */}
        <path d="M158 52 C158 10 330 0 444 150" fill="none" stroke="#c97b5a" strokeWidth="7" strokeLinecap="round"/>
        <path d="M312 52 C322 24 410 44 462 150" fill="none" stroke="#c97b5a" strokeWidth="7" strokeLinecap="round"/>
        {/* boîtier */}
        <rect x="424" y="150" width="100" height="150" rx="16" fill="#23312c"/>
        <rect x="440" y="168" width="68" height="44" rx="8" fill="#e7efea"/>
        <path d="M450 196 L462 184 L474 192 L488 178 L500 186" fill="none" stroke="#3f6f63" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="458" cy="244" r="10" fill="#c97b5a"/>
        <circle cx="490" cy="244" r="10" fill="#5d8a7d"/>
        <rect x="444" y="270" width="60" height="8" rx="4" fill="#35463f"/>
        {/* ondes de pression */}
        <g fill="none" stroke="#c97b5a" strokeWidth="4" strokeLinecap="round" opacity="0.6">
          <path d="M94 120 Q82 150 94 180"/><path d="M78 108 Q60 150 78 192"/>
        </g>
        <g fill="#c97b5a" opacity="0.5"><circle cx="60" cy="60" r="5"/><circle cx="536" cy="90" r="5"/></g>
      </svg>
    </div>
  );
}
