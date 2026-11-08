import { ChurchVisitMap } from '@cloudkid-labs/sda-church-site-core/react';
import { isVisible } from '@cloudkid-labs/sda-church-site-core';
import { useLanguage } from '../../context/LanguageContext';
import { homeCopy } from '../../data/homeCopy';
import { CHURCH_SITE } from '../../data/churchSite';
import { UI_CONFIG } from '../../data/uiConfig';

const visitMapSite = { ...CHURCH_SITE, visibility: UI_CONFIG.visibility };

export function VisitMap() {
  const { lang } = useLanguage();
  const t = homeCopy[lang];
  const labels = {
    eyebrow: t.visitEyebrow,
    heading: t.visitHeading,
    addressLabel: t.visitAddressLabel,
    copy: lang === 'af' ? 'Kopieer adres' : 'Copy address',
    copied: lang === 'af' ? 'Gekopieer' : 'Copied',
    failed: lang === 'af' ? 'Kon nie kopieer nie' : 'Could not copy',
    directions: t.directionsCta,
    saturday: lang === 'af' ? 'Sabbat' : 'Sabbath',
  };

  return (
    <section id="besoek" className="scroll-mt-24 bg-tan py-16">
      <div className="mx-auto max-w-content px-7">
        <ChurchVisitMap site={visitMapSite} locale={lang} labels={labels} visibilityPrefix="home.visit-map" />
        {isVisible(UI_CONFIG, 'home.visit-map.attribution-note') && <p className="mt-2 text-right text-xs text-slate-muted">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-2">OpenStreetMap contributors</a>
        </p>}
      </div>
    </section>
  );
}
