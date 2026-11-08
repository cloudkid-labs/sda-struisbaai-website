import { defineChurchSite } from '@cloudkid-labs/sda-church-site-core';
import { SERVICE_TIMES, SITE } from './site';

/**
 * Shared site contract for the core components. Church-specific copy, routes,
 * CMS storage and admin capabilities remain in this repository; common
 * metadata and the visit map come from the versioned core package.
 */
export const CHURCH_SITE = defineChurchSite({
  id: 'sda-struisbaai',
  name: { af: SITE.fullName, en: SITE.fullName },
  locales: ['af', 'en'],
  defaultLocale: 'af',
  timezone: 'Africa/Johannesburg',
  theme: { primary: '#0b3d54', accent: '#e8862c' },
  location: {
    address: SITE.address,
    lat: SITE.lat,
    lng: SITE.lng,
    directionsUrl: SITE.directionsUrl,
    markerUrl: '/map-marker.svg',
  },
  serviceTimes: SERVICE_TIMES.map((time) => ({
    name: { af: time.af, en: time.en },
    start: time.start,
    end: time.end,
  })),
  pages: [
    { slug: '', home: true, navigation: false, title: { af: 'Tuisblad', en: 'Home' } },
    { slug: 'beliefs', title: { af: 'Geloofspunte', en: 'Beliefs' } },
    { slug: 'bible-studies', title: { af: 'Bybelstudies', en: 'Bible studies' } },
    { slug: 'blood-bank', title: { af: 'Bloedbank', en: 'Blood bank' } },
    { slug: 'connect', title: { af: 'Kontak', en: 'Connect' } },
    { slug: 'giving', title: { af: 'Bydraes', en: 'Giving' } },
    { slug: 'youth', title: { af: 'Jeug', en: 'Youth' } },
  ],
  sections: [
    { id: 'service-times', type: 'serviceTimes', page: 'home' },
    { id: 'visit-map', type: 'map', page: 'home' },
    { id: 'text', type: 'text' },
    { id: 'callout', type: 'callout' },
    { id: 'card-grid', type: 'cardGrid' },
    { id: 'faq', type: 'faq' },
    { id: 'image', type: 'image' },
    { id: 'link-list', type: 'linkList' },
  ],
});
