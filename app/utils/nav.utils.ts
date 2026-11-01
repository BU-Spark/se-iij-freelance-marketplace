import type { NavItem } from '../components/NavMenu/config/navConfig';

/** True when the user is on this item's page (or a page inside it). */
export function isCurrentPath(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.exact) return false;
  return pathname.startsWith(`${item.href}/`);
}
