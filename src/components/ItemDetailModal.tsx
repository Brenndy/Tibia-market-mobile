import React from 'react';
import { Modal, View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { ItemDetailBody } from '../../app/item/[name]';

interface Props {
  name: string | null;
  world: string;
  onClose: () => void;
}

export function ItemDetailModal({ name, world, onClose }: Props) {
  const { width } = useWindowDimensions();
  const visible = name != null;
  const sheetWidth = Math.min(width - 48, 720);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, { width: sheetWidth }]}>
          {name && <ItemDetailBody name={name} world={world} embedded onClose={onClose} />}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
