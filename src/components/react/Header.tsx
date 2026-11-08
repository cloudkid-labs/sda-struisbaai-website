import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { homeCopy } from '../../data/homeCopy';
import { Logo } from './Logo';
import { LanguageToggle } from './LanguageToggle';
import { withBase } from '../../lib/base';
import { FEATURE_FLAGS } from '../../data/featureFlags';
import { UI_CONFIG } from '../../data/uiConfig';
import { isVisible } from '@cloudkid-labs/sda-church-site-core';

type NavKey = 'navAbout' | 'navBeliefs' | 'navMinistries' | 'navEvents' | 'navVisit' | 'navConnect' | 'navResources';

const navLinks: { key: NavKey; href: string; visibility: string }[] = [
  ...(FEATURE_FLAGS.departmentHeads ? [{ key: 'navAbout' as const, href: '#oor', visibility: 'home.department-heads' }] : []),
  { key: 'navBeliefs', href: '#glo', visibility: 'home.beliefs' },
  { key: 'navMinistries', href: '#week', visibility: 'home.this-week' },
  { key: 'navEvents', href: '#geleenthede', visibility: 'home.events' },
  { key: 'navVisit', href: '#besoek', visibility: 'home.visit-map' },
  { key: 'navConnect', href: '#betrokke', visibility: 'home.get-involved' },
  { key: 'navResources', href: '#hulpbronne', visibility: 'home.resources' },
];

function LoginLink({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  const { lang } = useLanguage();
  const t = homeCopy[lang];
  return (
    <a
      href={withBase('/login')}
      onClick={onClick}
      className={`h-8 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill border border-orange bg-orange/5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold text-navy hover:bg-orange hover:text-white transition-colors ${className}`}
    >
      {t.navLogin}
    </a>
  );
}

export function Header() {
  const { lang } = useLanguage();
  const t = homeCopy[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const visibleNavLinks = navLinks.filter((link) => isVisible(UI_CONFIG, link.visibility));

  useEffect(() => {
    if (!menuOpen) return;
    // The panel is in-flow, so mounting it grows the document by its own
    // height (352px measured: header 71px closed, 423px open) and the
    // browser's scroll anchoring shifts scrollY to compensate — that fires a
    // scroll event that is an artefact of opening, not a user scroll. Arm
    // the baseline only after that settles, so the guard does not depend on
    // effect-versus-layout timing: anything before the baseline exists is
    // ignored, and dismissal is then a fixed 10px deadband around the
    // position at open for genuine scrolling after opening. The baseline is
    // captured once and never re-based inside the handler — re-basing would
    // let a slow scroll walk the deadband along and never dismiss. Closing
    // flips menuOpen false, which runs this cleanup, clears the timer, and
    // drops both listeners — nothing lingers for the next open.
    let baseline: number | null = null;
    const arm = window.setTimeout(() => { baseline = window.scrollY; }, 250);
    const handleScroll = () => {
      if (baseline !== null && Math.abs(window.scrollY - baseline) > 10) setMenuOpen(false);
    };
    // Keyboard users get no scroll to dismiss with, so Escape closes too.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  if (!isVisible(UI_CONFIG, 'site.header')) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-subtle bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-3">
        {isVisible(UI_CONFIG, 'site.header.brand') && <a href="#top" className="flex items-center gap-3">
          {isVisible(UI_CONFIG, 'site.header.brand.logo') && <Logo size={46} />}
          {(isVisible(UI_CONFIG, 'site.header.brand.name') || isVisible(UI_CONFIG, 'site.header.brand.description')) && <div className="leading-tight">
            {isVisible(UI_CONFIG, 'site.header.brand.name') && <div className="font-serif text-2xl font-semibold leading-tight text-navy">Struisbaai</div>}
            {isVisible(UI_CONFIG, 'site.header.brand.description') && <div className="text-[10.5px] uppercase tracking-[.14em] text-slate-muted">
              {lang === 'af' ? 'Sewendedag Adventiste Kerk' : 'Seventh-day Adventist Church'}
            </div>}
          </div>}
        </a>}

        {isVisible(UI_CONFIG, 'site.header.navigation') && <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
          {visibleNavLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-ink hover:text-navy">
              {t[link.key]}
            </a>
          ))}
        </nav>}

        <div className="hidden items-center gap-3 lg:flex">
          {isVisible(UI_CONFIG, 'site.header.login') && <LoginLink />}
          {isVisible(UI_CONFIG, 'site.header.language-toggle') && <LanguageToggle />}
        </div>

        {isVisible(UI_CONFIG, 'site.header.menu-toggle') && <button
          type="button"
          aria-label={menuOpen ? (lang === 'af' ? 'Sluit kieslys' : 'Close menu') : lang === 'af' ? 'Open kieslys' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-pill border border-strong text-ink lg:hidden"
        >
          <span className="relative block h-3.5 w-4.5">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform duration-200 ${
                menuOpen ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current transition-opacity duration-200 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-200 ${
                menuOpen ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>}
      </div>

      {menuOpen && isVisible(UI_CONFIG, 'site.header.mobile-navigation') && (
        <div className="border-t border-subtle bg-cream px-5 py-4 lg:hidden">
          {isVisible(UI_CONFIG, 'site.header.navigation') && <nav className="flex flex-col gap-1 text-sm font-medium">
            {visibleNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-2 py-2.5 text-ink hover:bg-tan hover:text-navy"
              >
                {t[link.key]}
              </a>
            ))}
          </nav>}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-subtle pt-3.5">
            {isVisible(UI_CONFIG, 'site.header.login') && <LoginLink onClick={closeMenu} />}
            {isVisible(UI_CONFIG, 'site.header.language-toggle') && <LanguageToggle />}
          </div>
        </div>
      )}
    </header>
  );
}
