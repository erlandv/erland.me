export interface SidebarSocialLink {
  name: string;
  href: string;
  label: string;
}

export const sidebarSocialLinks: SidebarSocialLink[] = [
  { name: 'x', href: 'https://x.com/erlandzz', label: 'X' },
  {
    name: 'instagram',
    href: 'https://www.instagram.com/erlandramdhani',
    label: 'Instagram',
  },
  {
    name: 'facebook',
    href: 'https://www.facebook.com/erlandramdhani',
    label: 'Facebook',
  },
  { name: 'github', href: 'https://github.com/erlandv', label: 'GitHub' },
  {
    name: 'bluesky',
    href: 'https://bsky.app/profile/erland.me',
    label: 'Bluesky',
  },
];
