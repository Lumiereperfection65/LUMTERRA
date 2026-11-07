import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/constants/theme';

export function Button({ title, onPress, loading, variant = 'primary', disabled, icon }: {
  title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'outline' | 'danger'; disabled?: boolean; icon?: React.ReactNode;
}) {
  const bg = variant === 'primary' ? colors.emerald : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'outline' ? colors.emerald : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, borderColor: variant === 'outline' ? colors.emerald : bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (<>{icon}<Text style={[styles.btnText, { color: fg }]}>{title}</Text></>)}
    </Pressable>
  );
}

export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && { height: 110, textAlignVertical: 'top' }, props.style]} />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Banner({ text, tone = 'warning' }: { text: string; tone?: 'warning' | 'danger' }) {
  const c = tone === 'danger' ? colors.danger : '#B45309';
  return <View style={[styles.banner, { borderColor: c }]}><Text style={{ color: c, fontSize: 13 }}>{text}</Text></View>;
}

export const Loading = () => <ActivityIndicator color={colors.emerald} style={{ marginVertical: 24 }} />;

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', gap: 8, height: 50, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 50, fontSize: 16, color: colors.text },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, ...shadow },
  title: { fontSize: 26, fontWeight: '800', color: colors.emeraldDark },
  sub: { fontSize: 14, color: colors.muted },
  banner: { borderWidth: 1, borderRadius: radius.sm, padding: 10, backgroundColor: '#FFFBEB' },
});
