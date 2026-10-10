/**
 * Illustration flat du cabinet (visuel principal de l'accueil) : table de
 * soin, fenêtre lumineuse, tableau (profil et articulation de la mâchoire),
 * plante. Même style que les illustrations de /specialites, couleurs de la
 * palette du site. Remplit son conteneur (recadrage centré).
 */
export function CabinetIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <svg
        viewBox="0 0 560 460"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label="Illustration : salle de soin calme et lumineuse, avec table de massage et plante"
      >
        <rect width="560" height="460" fill="#e7efea"/>
        <circle cx="300" cy="230" r="200" fill="#dbe8e1"/>
        {/* fenêtre et lumière */}
        <path d="M84 230 L236 230 L330 400 L40 400 Z" fill="#ffffff" opacity="0.35"/>
        <rect x="80" y="60" width="160" height="170" rx="14" fill="#f6f4ee"/>
        <rect x="80" y="60" width="160" height="170" rx="14" fill="none" stroke="#c9dbd1" strokeWidth="8"/>
        <path d="M160 64 V226 M84 145 H236" stroke="#c9dbd1" strokeWidth="6"/>
        <circle cx="200" cy="100" r="16" fill="#f3e4dc"/>
        {/* tableau au mur : profil et mâchoire */}
        <rect x="340" y="80" width="130" height="100" rx="10" fill="#f6f4ee"/>
        <rect x="340" y="80" width="130" height="100" rx="10" fill="none" stroke="#3f6f63" strokeWidth="5"/>
        <path d="M378 160 C368 130 380 104 405 102 C426 100 438 114 440 128 L446 138 L440 142 L442 152 C436 158 424 158 418 160" fill="none" stroke="#2b5248" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="412" cy="134" r="5" fill="#c97b5a"/>
        {/* sol */}
        <rect x="0" y="400" width="560" height="60" fill="#d3e2d9"/>
        {/* table de soin */}
        <g>
          <rect x="160" y="326" width="14" height="78" rx="4" fill="#2b5248"/>
          <rect x="396" y="326" width="14" height="78" rx="4" fill="#2b5248"/>
          <rect x="180" y="352" width="210" height="8" rx="4" fill="#2b5248"/>
          <rect x="140" y="300" width="290" height="30" rx="12" fill="#3f6f63"/>
          <rect x="148" y="282" width="62" height="22" rx="11" fill="#f3e4dc"/>
          {/* serviette pliée */}
          <rect x="330" y="286" width="76" height="16" rx="6" fill="#c97b5a"/>
          <rect x="330" y="278" width="76" height="12" rx="6" fill="#e3a68b"/>
        </g>
        {/* plante */}
        <path d="M452 400 L460 352 L500 352 L508 400 Z" fill="#f3e4dc"/>
        <path d="M480 352 C472 312 452 302 444 278 C470 282 484 304 482 350" fill="#3f6f63"/>
        <path d="M480 352 C486 308 504 288 522 278 C520 308 500 328 482 352" fill="#2b5248"/>
        <path d="M480 352 C478 322 482 296 484 268" fill="none" stroke="#3f6f63" strokeWidth="4" strokeLinecap="round"/>
        {/* décor */}
        <g fill="#3f6f63" opacity="0.5"><circle cx="300" cy="60" r="5"/><circle cx="40" cy="300" r="4"/><circle cx="520" cy="220" r="5"/></g>
        <path d="M510 120 h16 M518 112 v16" stroke="#c97b5a" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
