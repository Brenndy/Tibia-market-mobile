import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ITEM_LIST } from '../data/itemList';
import { toTitleCase } from '../api/tibiaMarket';

const MAX_SUGGESTIONS = 20;

interface ItemSearchBarProps {
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
  placeholder?: string;
}

export function ItemSearchBar({ selectedItems, onSelectedItemsChange, placeholder }: ItemSearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const suggestions = query.length >= 2
    ? ITEM_LIST
        .filter((i) => i.n.toLowerCase().includes(query.toLowerCase()) && !selectedItems.includes(i.n))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const handleSelect = useCallback((name: string) => {
    onSelectedItemsChange([...selectedItems, name]);
    setQuery('');
    inputRef.current?.focus();
  }, [selectedItems, onSelectedItemsChange]);

  const handleRemove = useCallback((name: string) => {
    onSelectedItemsChange(selectedItems.filter((n) => n !== name));
  }, [selectedItems, onSelectedItemsChange]);

  const showDropdown = query.length >= 2 && suggestions.length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Selected chips + input row */}
      <View style={styles.inputBox}>
        <MaterialCommunityIcons name="magnify" size={16} color={colors.textMuted} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
          keyboardShouldPersistTaps="always"
        >
          {selectedItems.map((name) => (
            <View key={name} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>{toTitleCase(name)}</Text>
              <TouchableOpacity onPress={() => handleRemove(name)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                <MaterialCommunityIcons name="close" size={12} color={colors.gold} />
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={[styles.input, selectedItems.length > 0 && { minWidth: 80 }]}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={selectedItems.length === 0 ? (placeholder ?? 'Szukaj przedmiotu...') : ''}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </ScrollView>

        {(query.length > 0 || selectedItems.length > 0) && (
          <TouchableOpacity
            onPress={() => { setQuery(''); onSelectedItemsChange([]); }}
            style={styles.clear}
          >
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 220 }}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestion}
                onPress={() => handleSelect(item.n)}
              >
                <Text style={styles.suggestionText}>{toTitleCase(item.n)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 100,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 6,
    minHeight: 44,
    gap: 6,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold + '60',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 120,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 14,
    minWidth: 120,
    paddingVertical: 0,
  },
  clear: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
});
