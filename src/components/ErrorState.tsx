import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Coś poszło nie tak. Spróbuj ponownie.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.sell} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Spróbuj ponownie</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },
});
