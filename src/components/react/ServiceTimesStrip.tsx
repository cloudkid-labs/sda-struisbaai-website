import { isVisible } from '@cloudkid-labs/sda-church-site-core';
import { useLanguage } from '../../context/LanguageContext';
import { homeCopy } from '../../data/homeCopy';
import { SERVICE_TIMES, serviceRange } from '../../data/site';
import { UI_CONFIG } from '../../data/uiConfig';

export function ServiceTimesStrip() {
  const { lang } = useLanguage();
  const t = homeCopy[lang];

  return (
    <section className="bg-navy text-white">
      <div className="mx-auto flex max-w-content flex-col items-center gap-2 px-7 py-5 text-center sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-0 sm:gap-y-3">
        {isVisible(UI_CONFIG, 'home.service-times.label') && <span className="text-xs font-bold uppercase tracking-[.1em] sm:border-l sm:border-white/20 sm:px-5 sm:py-1 sm:first:border-l-0">
          {t.timesLabel}
        </span>}
        {SERVICE_TIMES.map((entry, index) => isVisible(UI_CONFIG, `home.service-times.item.${index}`) && (
          <span key={entry.en} className="text-sm sm:border-l sm:border-white/20 sm:px-5 sm:py-1">
            {isVisible(UI_CONFIG, `home.service-times.item.${index}.name`) && entry[lang]} {isVisible(UI_CONFIG, `home.service-times.item.${index}.hours`) && <strong className="text-base">{serviceRange(entry)}</strong>}
          </span>
        ))}
      </div>
    </section>
  );
}
