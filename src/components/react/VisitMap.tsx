import { useLanguage } from '../../context/LanguageContext';
import { homeCopy } from '../../data/homeCopy';
import { SITE } from '../../data/site';
import { withBase } from '../../lib/base';

export function VisitMap() {
  const { lang } = useLanguage();
  const t = homeCopy[lang];

  return (
    <section id="besoek" className="scroll-mt-24 bg-tan py-16">
      <div className="mx-auto grid max-w-content grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5 px-7">
        <div className="rounded-card-lg bg-cream-card p-7 shadow-card">
          <div className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-orange">
            {t.visitEyebrow}
          </div>
          <h2 className="mb-6 font-serif text-2xl font-medium text-ink">{t.visitHeading}</h2>
          <div className="mb-2 text-xs font-bold uppercase tracking-[.08em] text-slate-muted">
            {t.visitAddressLabel}
          </div>
          <p className="mb-6 text-ink">{SITE.address}</p>
          <a
            href={SITE.directionsUrl}
            target="_blank"
            rel="noopener"
            className="block rounded-pill bg-orange px-5 py-3 text-center font-semibold text-white hover:bg-orange-hover"
          >
            {t.directionsCta} →
          </a>
        </div>

        <div className="relative min-h-[300px] overflow-hidden rounded-card-lg">
          <iframe
            src={withBase('/map/')}
            title="Map to Struisbaai Library Hall"
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
