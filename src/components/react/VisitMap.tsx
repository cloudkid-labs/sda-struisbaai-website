import { ChurchVisitMap } from '@cloudkid-labs/sda-church-site-core/react';
import { useLanguage } from '../../context/LanguageContext';
import { homeCopy } from '../../data/homeCopy';
import { CHURCH_SITE } from '../../data/churchSite';

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
        <ChurchVisitMap site={CHURCH_SITE} locale={lang} labels={labels} />
      </div>
    </section>
  );
}
