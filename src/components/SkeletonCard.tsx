import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

function SkeletonBox({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 6, backgroundColor: colors.surfaceElevated, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonBox width={40} height={40} style={styles.img} />
        <View style={styles.titleCol}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="30%" height={10} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={18} height={18} style={{ borderRadius: 9 }} />
      </View>
      <View style={styles.priceRow}>
        <View style={styles.priceBlock}>
          <SkeletonBox width="70%" height={10} />
          <SkeletonBox width="80%" height={18} style={{ marginTop: 6 }} />
          <SkeletonBox width="60%" height={10} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.priceBlock}>
          <SkeletonBox width="70%" height={10} />
          <SkeletonBox width="80%" height={18} style={{ marginTop: 6 }} />
          <SkeletonBox width="60%" height={10} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.priceBlock}>
          <SkeletonBox width="70%" height={10} />
          <SkeletonBox width="80%" height={18} style={{ marginTop: 6 }} />
          <SkeletonBox width="40%" height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.footer}>
        <SkeletonBox width="25%" height={10} />
        <SkeletonBox width="40%" height={6} style={{ borderRadius: 3 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  img: {
    borderRadius: 8,
  },
  titleCol: {
    flex: 1,
    gap: 0,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 0,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
