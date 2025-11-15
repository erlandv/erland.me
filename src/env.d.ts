/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly SITE_DOMAIN?: string;
  readonly PUBLIC_SITE_ENV?: string;
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_ADSENSE_CLIENT?: string;
  readonly PUBLIC_ADSENSE_SLOT_BLOG_MID?: string;
  readonly PUBLIC_ADSENSE_SLOT_BLOG_END?: string;
  readonly PUBLIC_ADSENSE_SLOT_DL_MID?: string;
  readonly PUBLIC_ADSENSE_SLOT_DL_END?: string;
  readonly PUBLIC_AHREFS_DATA_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
