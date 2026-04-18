import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { useWorld } from '../context/WorldContext';
import { useWorlds } from '../hooks/useMarket';
import { timeAgo } from '../utils/timeAgo';
import { WorldSelectModal } from './WorldSelectModal';

const DESKTOP_BREAKPOINT = 900;

export function WorldBadge() {
  const { selectedWorld } = useWorld();
  const { data: worlds } = useWorlds();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const current = worlds?.find((w) => w.name === selectedWorld);
  const sync = current?.last_update ? timeAgo(current.last_update) : '';
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const openPicker = () => {
    if (isDesktop) {
      setModalVisible(true);
    } else {
      router.push('/world-select');
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={openPicker}>
        <MaterialCommunityIcons name="earth" size={14} color={colors.gold} />
        <View style={styles.textCol}>
          <Text style={styles.text}>{selectedWorld}</Text>
          {sync ? <Text style={styles.sync}>{sync}</Text> : null}
        </View>
        <View style={styles.chevron}>
          <MaterialCommunityIcons name="chevron-down" size={14} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {isDesktop && (
        <WorldSelectModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  textCol: {
    alignItems: 'flex-start',
    gap: 0,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 15,
  },
  sync: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 11,
  },
  chevron: {
    marginLeft: 'auto',
    paddingLeft: 12,
  },
});
