import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { authState, member, signOut } = useUserAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Inicio", href: "/" },
    { label: "Propiedades", href: "/propiedades" },
    { label: "Barcos", href: "/barcos" },
    { label: "Hostales", href: "/hostales" },
    { label: "Camping", href: "/camping" },
    { label: "Anfitriones", href: "/registro-anfitrion" },
    { label: "Inmobiliarias", href: "/inmobiliarias" },
  ];

  const isTransparent = isHome && !scrolled;
  const isAuthenticated = authState === "authenticated";
  const isAnfitrion = member?.tipo === "anfitrion";
  const panelPath = isAnfitrion ? "/mi-panel" : "/mi-cuenta";
  const displayName = member?.nombre ? member.nombre.split(" ")[0] : "Mi cuenta";

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isTransparent
          ? "bg-transparent"
          : "bg-cream-50/97 backdrop-blur-md border-b border-gold-200/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://static.readdy.ai/image/50e49e5b27cb755174d08442fb82be78/0382ce5f5531b6331d655d1fe255f2da.png"
            alt="NEXURA Logo"
            className="h-16 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium tracking-wide transition-colors duration-200 cursor-pointer whitespace-nowrap font-body ${
                isTransparent
                  ? "text-white/90 hover:text-gold-300"
                  : "text-charcoal-600 hover:text-gold-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {authState === "loading" ? (
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${isTransparent ? "border-white/60" : "border-gold-300"}`} />
          ) : isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full border transition-all duration-200 cursor-pointer whitespace-nowrap font-body ${
                  isTransparent
                    ? "border-white/60 text-white hover:bg-white/10"
                    : "border-gold-300 text-charcoal-700 hover:border-gold-500"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isTransparent ? "bg-white/20 text-white" : "bg-gold-gradient text-white"}`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span>{displayName}</span>
                <i className={`ri-arrow-down-s-line text-xs transition-transform ${dropdownOpen ? "rotate-180" : ""}`}></i>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-cream-50 rounded-xl border border-gold-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gold-100">
                    <p className="text-xs text-gold-600 font-medium uppercase tracking-wide font-body">
                      {isAnfitrion ? "Anfitrión" : "Huésped"}
                    </p>
                    <p className="text-sm font-semibold text-charcoal-800 truncate mt-0.5 font-body">
                      {member?.nombre || member?.email}
                    </p>
                  </div>
                  <Link
                    to={panelPath}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-charcoal-700 hover:bg-gold-50 transition-colors cursor-pointer font-body"
                  >
                    <i className={`${isAnfitrion ? "ri-home-4-line" : "ri-user-line"} text-gold-500`}></i>
                    {isAnfitrion ? "Mi panel" : "Mi cuenta"}
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-charcoal-700 hover:bg-gold-50 transition-colors cursor-pointer font-body border-t border-gold-100"
                  >
                    <i className="ri-shield-keyhole-line text-gold-500"></i>
                    Panel admin
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-t border-gold-100 font-body"
                  >
                    <i className="ri-logout-box-r-line"></i>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login?tipo=huesped"
                className={`text-sm font-medium px-5 py-2.5 rounded-full border transition-all duration-200 cursor-pointer whitespace-nowrap font-body ${
                  isTransparent
                    ? "border-white/60 text-white hover:bg-white/10 hover:border-white"
                    : "border-gold-300 text-charcoal-700 hover:border-gold-500 hover:text-gold-700"
                }`}
              >
                <i className="ri-user-line mr-1.5"></i>Mi cuenta
              </Link>
              <Link
                to="/login?tipo=anfitrion"
                className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap font-body ${
                  isTransparent
                    ? "bg-gold-gradient text-white hover:opacity-90"
                    : "bg-gold-gradient text-white hover:opacity-90"
                }`}
              >
                <i className="ri-home-4-line mr-1.5"></i>Mi panel
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`md:hidden w-10 h-10 flex items-center justify-center cursor-pointer ${
            isTransparent ? "text-white" : "text-charcoal-800"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <i className={`text-xl ${menuOpen ? "ri-close-line" : "ri-menu-3-line"}`}></i>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-cream-50 border-t border-gold-200/60 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-charcoal-700 font-medium text-sm py-2 cursor-pointer hover:text-gold-600 transition-colors font-body"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-gold-200/60">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-1 py-1">
                  <div className="w-8 h-8 rounded-full bg-gold-gradient text-white flex items-center justify-center text-sm font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gold-600 font-body">{isAnfitrion ? "Anfitrión" : "Huésped"}</p>
                    <p className="text-sm font-semibold text-charcoal-800 font-body">{displayName}</p>
                  </div>
                </div>
                <Link
                  to={panelPath}
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-sm font-semibold px-5 py-2.5 rounded-full bg-gold-gradient text-white cursor-pointer whitespace-nowrap font-body"
                >
                  <i className={`${isAnfitrion ? "ri-home-4-line" : "ri-user-line"} mr-1.5`}></i>
                  {isAnfitrion ? "Mi panel" : "Mi cuenta"}
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-sm font-medium px-5 py-2.5 rounded-full border border-stone-800 text-stone-800 cursor-pointer whitespace-nowrap font-body"
                >
                  <i className="ri-shield-keyhole-line mr-1.5"></i>Panel admin
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-center text-sm font-medium px-5 py-2.5 rounded-full border border-red-200 text-red-500 cursor-pointer whitespace-nowrap font-body"
                >
                  <i className="ri-logout-box-r-line mr-1.5"></i>Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login?tipo=huesped"
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-sm font-medium px-5 py-2.5 rounded-full border border-gold-300 text-charcoal-700 cursor-pointer whitespace-nowrap font-body"
                >
                  <i className="ri-user-line mr-1.5"></i>Mi cuenta
                </Link>
                <Link
                  to="/login?tipo=anfitrion"
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-sm font-semibold px-5 py-2.5 rounded-full bg-gold-gradient text-white cursor-pointer whitespace-nowrap font-body"
                >
                  <i className="ri-home-4-line mr-1.5"></i>Mi panel
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-sm font-medium px-5 py-2.5 rounded-full border border-stone-800 text-stone-800 cursor-pointer whitespace-nowrap font-body"
                >
                  <i className="ri-shield-keyhole-line mr-1.5"></i>Panel admin
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}