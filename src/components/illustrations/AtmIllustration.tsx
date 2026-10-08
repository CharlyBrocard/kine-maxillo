/**
 * Illustration flat de la rééducation oro-maxillo-faciale (page
 * /specialites) : profil, articulation temporo-mandibulaire mise en
 * évidence, mouvement d'ouverture de la mâchoire. Couleurs de la palette
 * du site (globals.css). Remplit son conteneur (recadrage centré).
 */
export function AtmIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <svg
        viewBox="0 0 560 440"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label="Illustration : articulation de la mâchoire (ATM) et mouvement d'ouverture"
      >
        <rect width="560" height="440" fill="#e7efea"/>
        <circle cx="300" cy="230" r="190" fill="#dbe8e1"/>
        <circle cx="470" cy="80" r="46" fill="#f3e4dc"/>
        {/* tête */}
        <path d="M238 440 L236 330 C214 322 190 300 178 260 C160 200 180 140 230 110 C300 60 390 90 410 160 C418 190 415 205 420 215 L418 222 C440 250 452 262 446 270 C440 276 428 276 424 280 C432 288 432 296 424 300 L420 302 C430 308 428 318 418 322 C424 340 420 360 395 368 C362 374 336 362 322 352 C320 385 318 410 322 440 Z" fill="#f3e4dc"/>
        {/* cheveux */}
        <path d="M236 330 C214 322 190 300 178 260 C160 200 180 140 230 110 C300 60 390 90 410 160 C380 140 332 136 304 160 C288 178 284 205 281 226 C276 266 262 304 236 330 Z" fill="#2b5248"/>
        {/* oreille */}
        <ellipse cx="300" cy="234" rx="15" ry="26" fill="#e9cdbf"/>
        {/* sourcil, œil fermé */}
        <path d="M380 186 Q394 179 408 185" fill="none" stroke="#2b5248" strokeWidth="4" strokeLinecap="round"/>
        <path d="M386 206 Q395 213 405 206" fill="none" stroke="#2b5248" strokeWidth="4" strokeLinecap="round"/>
        {/* mandibule */}
        <path d="M326 238 L326 324 C330 342 362 352 400 350" fill="none" stroke="#c97b5a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        {/* ATM */}
        <circle cx="326" cy="238" r="34" fill="#c97b5a" opacity="0.15"/>
        <circle cx="326" cy="238" r="21" fill="#c97b5a" opacity="0.25"/>
        <circle cx="326" cy="238" r="10" fill="#c97b5a"/>
        {/* mouvement d'ouverture */}
        <path d="M452 296 A 110 110 0 0 1 420 392" fill="none" stroke="#3f6f63" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12"/>
        <path d="M410 382 L419 394 L432 387" fill="none" stroke="#3f6f63" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* décor */}
        <g fill="#3f6f63" opacity="0.5"><circle cx="110" cy="90" r="5"/><circle cx="500" cy="250" r="6"/><circle cx="90" cy="360" r="4"/></g>
        <path d="M468 160 h18 M477 151 v18" stroke="#c97b5a" strokeWidth="4" strokeLinecap="round"/>
        <path d="M120 230 h14 M127 223 v14" stroke="#3f6f63" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
