import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/src/theme/colors';

interface TooltipProps {
  label: string;
  sublabel?: string;
  side?: 'right' | 'bottom';
  delayMs?: number;
  children: React.ReactNode;
}

export function Tooltip({
  label,
  sublabel,
  side = 'right',
  delayMs = 450,
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb = Platform.OS === 'web';

  if (!isWeb) return <>{children}</>;

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(true), delayMs);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  return (
    <View
      {...({ onMouseEnter: show, onMouseLeave: hide } as any)}
      style={styles.wrap}
    >
      {children}
      {visible && (
        <View
          pointerEvents="none"
          style={[styles.bubble, side === 'right' ? styles.bubbleRight : styles.bubbleBottom]}
        >
          <Text style={styles.label}>{label}</Text>
          {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.gold + '55',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1000,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: `0 4px 12px ${colors.gold}22` } as any)
      : {
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        }),
  },
  bubbleRight: {
    left: '100%',
    top: '50%',
    marginLeft: 10,
    transform: [{ translateY: -16 }],
  },
  bubbleBottom: {
    top: '100%',
    left: 0,
    marginTop: 6,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as any) : {}),
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as any) : {}),
  },
});
