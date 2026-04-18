import { useWindowDimensions } from 'react-native';

export const DESKTOP_BREAKPOINT = 900;
export const WIDE_DESKTOP_BREAKPOINT = 1400;

export function useResponsiveColumns(): { numColumns: number; isDesktop: boolean; width: number } {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const numColumns = width >= WIDE_DESKTOP_BREAKPOINT ? 3 : isDesktop ? 2 : 1;
  return { numColumns, isDesktop, width };
}
