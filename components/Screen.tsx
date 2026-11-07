import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

interface Props { children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean; style?: ViewStyle; noScroll?: boolean }

/** Conteneur responsive : contenu centré, largeur max 640 px sur tablette/web. */
export function Screen({ children, onRefresh, refreshing = false, style, noScroll }: Props) {
  const insets = useSafeAreaInsets();
  const inner = <View style={[styles.inner, style]}>{children}</View>;
  if (noScroll) return <View style={[styles.root, { paddingTop: insets.top }]}>{inner}</View>;
  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} /> : undefined}
    >
      {inner}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 640, padding: 20, gap: 16 },
});
