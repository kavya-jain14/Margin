import type { Cover } from "@/lib/blog/types";

export default function CoverArt({cover, className = ""}: {cover: Cover; className?: string}) {
  return <div className={`cover-art cover-${cover} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 640 450" preserveAspectRatio="xMidYMid slice" focusable="false">
      {cover === "stillness" ? <>
        <rect width="640" height="450" fill="#747b50" />
        <circle cx="462" cy="139" r="72" fill="#d9dcb7" />
        <path d="M0 395C130 298 196 433 342 324S540 276 640 344V450H0Z" fill="#5d6441" />
        <path d="M250 450V197a82 82 0 0 1 164 0v253" fill="#ece8d4" />
        <path d="M284 450V211a48 48 0 0 1 96 0v239" fill="#a2ab78" />
        <path d="M332 450V309m0 38c-72-12-102-67-97-111 57 4 97 54 97 111Zm0-23c54-17 88-55 84-102-50 1-84 56-84 102Z" fill="#353f30" />
        <path d="M88 54h82M129 13v82" stroke="#d9dcb7" strokeWidth="1.5" />
        <circle cx="129" cy="54" r="26" fill="none" stroke="#d9dcb7" strokeWidth="1.5" />
        <path d="M38 407h92m-70 12h62" stroke="#cad0a6" />
      </> : null}
      {cover === "shapes" ? <>
        <rect width="640" height="450" fill="#e7b8a1" />
        <rect x="164" y="100" width="230" height="255" rx="110" fill="#eedecc" transform="rotate(-18 280 225)" />
        <path d="M300 97h168v258H300Z" fill="#a74931" />
        <circle cx="300" cy="226" r="102" fill="#283f3c" />
        <circle cx="300" cy="226" r="53" fill="#e7b8a1" />
        <path d="M501 331h65m-32-33v65" stroke="#283f3c" strokeWidth="2" />
        <path d="M40 45h70M40 55h35" stroke="#a74931" strokeWidth="2" />
      </> : null}
      {cover === "code" ? <>
        <rect width="640" height="450" fill="#b9c4d1" />
        <path d="M0 360 640 80M0 420 640 140M0 300 640 20M0 240 550 0" stroke="#8c9faf" />
        <rect x="110" y="75" width="420" height="285" fill="#23383f" />
        <path d="M110 116h420" stroke="#718c91" />
        <circle cx="132" cy="96" r="5" fill="#e9a587"/><circle cx="151" cy="96" r="5" fill="#d9ce8b"/><circle cx="170" cy="96" r="5" fill="#a2bda0"/>
        <path d="m240 180-42 42 42 42m160-84 42 42-42 42m-58-100-44 116" stroke="#dce5da" strokeWidth="10" fill="none" />
        <path d="M145 319h102m26 0h42" stroke="#7fa3a4" strokeWidth="5" />
      </> : null}
      {cover === "sunset" ? <>
        <rect width="640" height="450" fill="#d49c61" />
        <circle cx="422" cy="162" r="93" fill="#eedbc0" />
        <path d="M0 340c100-79 182-9 310-61s220-25 330 34v137H0Z" fill="#a85b42" />
        <path d="M161 108h122l22 251H183Zm148 11h65l-20 240h-65Z" fill="#774633" />
        <path d="M179 106h110v243H179Z" fill="#f0ddba"/><path d="M197 106h91v243h-91Z" fill="#dbba85" />
        <path d="M206 143h64m-64 15h49m-49 149h64" stroke="#774633" strokeWidth="3" />
        <path d="M313 116h68v243h-68Z" fill="#476355"/><path d="M327 136h41m-41 201h41" stroke="#cbd2ac" strokeWidth="3" />
      </> : null}
      {cover === "landscape" ? <>
        <rect width="640" height="450" fill="#dce0bd" />
        <circle cx="418" cy="109" r="48" fill="#cc854f" />
        <path d="m0 252 162-160 165 190L479 156l161 134v160H0Z" fill="#7f997c" />
        <path d="m0 356 221-114 169 108 250-80v180H0Z" fill="#3c6253" />
        <path d="M304 450c-82-60-84-81-30-113s40-51 2-66c58 10 105 38 64 78s9 68 59 101" fill="#e8d6ab" />
        <path d="M91 57c14-10 22-10 35 0 13-10 23-10 36 0" stroke="#3c6253" strokeWidth="2" fill="none" />
      </> : null}
      {cover === "play" ? <>
        <rect width="640" height="450" fill="#d8cfaa" />
        <circle cx="199" cy="219" r="93" fill="#da704d" />
        <path d="m396 67 93 162H303Z" fill="#59766c" />
        <rect x="324" y="242" width="134" height="134" fill="#9bacc2" transform="rotate(15 391 309)" />
        <path d="m207 193 10 19m-39-7 9 19m-25 23c18 22 42 20 62 2" stroke="#f2e6c7" strokeWidth="6" fill="none" />
        <path d="m508 79 7 19 21 2-17 12 5 20-17-12-18 10 7-20-16-13 21 1Z" fill="#a34d37" />
      </> : null}
    </svg>
  </div>;
}
