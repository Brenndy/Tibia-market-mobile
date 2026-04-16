import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

// Shared sweep animation — one driver for all skeletons
const sweep = new Animated.Value(0);
let sweepStarted = false;
function ensureSweep() {
  if (sweepStarted) return;
  sweepStarted = true;
  Animated.loop(
    Animated.timing(sweep, {
      toValue: 1,
      duration: 1400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }),
  ).start();
}

function SkeletonBox({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: any;
}) {
  useEffect(() => {
    ensureSweep();
  }, []);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 220],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: 6,
          backgroundColor: colors.surfaceElevated,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 120,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(212,175,55,0.14)',
            'rgba(212,175,55,0.28)',
            'rgba(212,175,55,0.14)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
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
