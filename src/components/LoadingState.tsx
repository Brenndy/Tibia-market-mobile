import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from '../context/LanguageContext';

interface LoadingStateProps {
  message?: string;
}

export function GoldSpinner({ size = 56 }: { size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    spinAnim.start();
    pulseAnim.start();
    return () => {
      spinAnim.stop();
      pulseAnim.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  const ringThickness = Math.max(3, Math.round(size * 0.09));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.gold,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringThickness,
          borderColor: colors.goldDim,
          borderTopColor: colors.gold,
          borderRightColor: colors.goldLight,
          transform: [{ rotate }],
        }}
      />
      <View style={{ position: 'absolute' }}>
        <MaterialCommunityIcons name="crown" size={Math.round(size * 0.4)} color={colors.gold} />
      </View>
    </View>
  );
}

export function LoadingState({ message }: LoadingStateProps) {
  const { t } = useTranslation();
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dots, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(dots, { toValue: 0, duration: 600, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [dots]);

  return (
    <View style={styles.container}>
      <GoldSpinner size={64} />
      <Animated.Text style={[styles.text, { opacity: dots.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]}>
        {message ?? t('loading')}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 18,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
