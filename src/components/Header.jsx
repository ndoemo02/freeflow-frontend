export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-black/20 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-14 items-center justify-between">
          {/* brand + podtytuł */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-baseline gap-1 font-extrabold text-2xl tracking-tight">
              <span className="text-orange-400">Free</span>
              <span className="text-white">Flow</span>
            </a>

            {/* PODTYTUŁ przeniesiony z hero */}
            <p className="hidden md:block text-sm text-white/70">
              Voice to order — Złóż zamówienie
            </p>
          </div>

          {/* prawa strona na ikony/menu/koszyk */}
          <div className="flex items-center gap-2">
            {/* ...Twoje przyciski/menu/koszyk... */}
          </div>
        </nav>
      </div>
    </header>
  );
}
