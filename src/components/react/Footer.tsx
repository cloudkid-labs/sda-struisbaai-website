import { useEffect, useState } from 'react';
import { isVisible } from '@cloudkid-labs/sda-church-site-core';
import { useLanguage } from '../../context/LanguageContext';
import { homeCopy } from '../../data/homeCopy';
import { SERVICE_TIMES, SITE, serviceRange } from '../../data/site';
import { UI_CONFIG } from '../../data/uiConfig';
import { Logo } from './Logo';
import { SocialLinks } from './SocialLinks';

export function Footer() {
  const { lang } = useLanguage();
  const t = homeCopy[lang];

  /*
   * Seeded from the build date and corrected after mount. `new Date()` during
   * render bakes the build year into the static HTML, so a site built in
   * December still says the old year in January — permanently for a reader with
   * JavaScript off, and briefly for everyone else. Same shape as the blood
   * drive seed, and for the same reason. C-36, C-44
   */
  const [year, setYear] = useState(() => Number(import.meta.env.PUBLIC_BUILD_DATE.slice(0, 4)));
  useEffect(() => setYear(new Date().getFullYear()), []);

  if (!isVisible(UI_CONFIG, 'site.footer')) return null;

  return (
    <footer className="bg-navy-deep text-blue-pale">
      <div className="mx-auto grid max-w-content grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-8 px-7 py-11">
        {isVisible(UI_CONFIG, 'site.footer.brand') && <div>
          {isVisible(UI_CONFIG, 'site.footer.brand.logo') && <div className="mb-3 flex items-center gap-2.5">
            <Logo size={30} />
            {isVisible(UI_CONFIG, 'site.footer.brand.name') && <span className="font-serif text-base text-white">SDA Struisbaai</span>}
          </div>}
          {isVisible(UI_CONFIG, 'site.footer.brand.blurb') && <p className="text-sm">{t.footerBlurb}</p>}
        </div>}
        {isVisible(UI_CONFIG, 'site.footer.visit') && <div>
          {isVisible(UI_CONFIG, 'site.footer.visit.heading') && <div className="mb-2 text-xs font-bold uppercase tracking-[.08em] text-blue-muted">
            {t.footerVisit}
          </div>}
          {isVisible(UI_CONFIG, 'site.footer.visit.address') && <p className="mb-1 text-sm">{SITE.address}</p>}
          {isVisible(UI_CONFIG, 'site.footer.social') && <div className="mt-4.5">
            <SocialLinks label={t.followUs} newTab={t.opensNewTab} variant="navy" />
          </div>}
        </div>}
        {isVisible(UI_CONFIG, 'site.footer.service-times') && <div>
          {isVisible(UI_CONFIG, 'site.footer.service-times.heading') && <div className="mb-2 text-xs font-bold uppercase tracking-[.08em] text-blue-muted">
            {t.footerTimesLabel}
          </div>}
          {SERVICE_TIMES.map((entry) => (
            <div key={entry.en} className="text-sm">
              {entry[lang]} — {serviceRange(entry)}
            </div>
          ))}
        </div>}
      </div>
      {isVisible(UI_CONFIG, 'site.footer.credits') && <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-content flex-wrap items-center gap-4 px-7 py-5 text-xs">
          {isVisible(UI_CONFIG, 'site.footer.credits.copyright') && <span>© {year} SDA Struisbaai</span>}
          {isVisible(UI_CONFIG, 'site.footer.credits.builder') && <a href="https://cloudkid.link" target="_blank" rel="noopener" className="font-semibold text-orange hover:text-white">
            {t.footerCreditBuilder}
          </a>}
          {isVisible(UI_CONFIG, 'site.footer.credits.church') && <a href="https://adventist.org" target="_blank" rel="noopener" className="font-semibold text-orange hover:text-white">
            {t.footerCreditChurch}
          </a>}
        </div>
      </div>}
    </footer>
  );
}
