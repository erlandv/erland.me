export interface SidebarSocialLink {
  name: string;
  href: string;
  label: string;
}

export const sidebarSocialLinks: SidebarSocialLink[] = [
  { name: 'socialX', href: 'https://x.com/erlandzz', label: 'X' },
  {
    name: 'socialInstagram',
    href: 'https://www.instagram.com/erlandramdhani',
    label: 'Instagram',
  },
  {
    name: 'socialFacebook',
    href: 'https://www.facebook.com/erlandramdhani',
    label: 'Facebook',
  },
  { name: 'socialGithub', href: 'https://github.com/erlandv', label: 'GitHub' },
  {
    name: 'socialBluesky',
    href: 'https://bsky.app/profile/erland.me',
    label: 'Bluesky',
  },
];
