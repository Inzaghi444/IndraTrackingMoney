import { createElement } from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Clapperboard,
  Receipt,
  HeartPulse,
  GraduationCap,
  Ellipsis,
  Briefcase,
  Gift,
  TrendingUp,
  HandCoins,
  Circle,
  ArrowLeftRight,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  clapperboard: Clapperboard,
  receipt: Receipt,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  ellipsis: Ellipsis,
  briefcase: Briefcase,
  gift: Gift,
  'trending-up': TrendingUp,
  'hand-coins': HandCoins,
  circle: Circle,
  'arrow-left-right': ArrowLeftRight,
  wallet: Wallet,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICONS[name] ?? Circle;
}

/** Ikon kategori dalam lingkaran berwarna lembut */
export function CategoryIcon({
  icon,
  color,
  size = 'md',
}: {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9.5';
  const glyph = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-5' : 'size-4.5';

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full`}
      style={{ backgroundColor: `${color}1F`, color }}
      aria-hidden
    >
      {/* createElement: menghindari variabel komponen yang dibuat saat render */}
      {createElement(getCategoryIcon(icon), { className: glyph })}
    </span>
  );
}
