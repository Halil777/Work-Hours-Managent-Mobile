// src/screens/misc/ProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Profile = {
  fullName: string;
  jobTitle: string;
  civilNumber: string; // 10 цифр
  phone: string;
  email?: string;
};

const initialProfile: Profile = {
  fullName: 'Halil Gayypov',
  jobTitle: 'Системный администратор',
  civilNumber: '0007071310',
  phone: '+7 911 509 8859',
  email: 'halil.gayypov@example.com',
};

const cardShadow = Platform.select({
  web: { boxShadow: '0 6px 16px rgba(0,0,0,0.1)' },
  default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
}) as any;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [form, setForm] = useState<Profile>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({});

  // Toast (успешное сохранение)
  const [toast, setToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = (msg: string) => {
    setToast(msg);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' })
          .start(() => setToast(null));
      }, 1400);
    });
  };

  const initials = useMemo(() => {
    const parts = profile.fullName.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
  }, [profile.fullName]);

  const setField = <K extends keyof Profile>(key: K, val: Profile[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof Profile, string>> = {};
    // ФИО: iň az 2 sözi bar bolsun
    const words = (form.fullName || '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) errs.fullName = 'Укажите имя и фамилию';

    // Civil: diňe san, 10 length
    const digits = (form.civilNumber || '').replace(/\D/g, '');
    if (digits.length !== 10) errs.civilNumber = 'Должно быть ровно 10 цифр';

    // Phone: iň bolmanda 7-8 sany san bolsun
    const phoneDigits = (form.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 8) errs.phone = 'Введите корректный номер телефона';

    // Email (islege görä)
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Некорректный email';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    setProfile(form);
    setEditing(false);
    showToast('Сохранено');
  };

  const onCancel = () => {
    setForm(profile);
    setErrors({});
    setEditing(false);
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header card with avatar */}
          <View style={[styles.headerCard, cardShadow]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nameText}>{profile.fullName}</Text>
              <Text style={styles.jobText}>{profile.jobTitle}</Text>
            </View>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn} activeOpacity={0.9}>
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.editBtnText}>Редактировать</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={onCancel} style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]} activeOpacity={0.9}>
                  <Text style={[styles.actionBtnText, { color: '#0f172a' }]}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSave} style={[styles.actionBtn, { backgroundColor: '#2563eb' }]} activeOpacity={0.9}>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Info card */}
          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardTitle}>Личные данные</Text>

            <Field
              label="ФИО"
              value={editing ? form.fullName : profile.fullName}
              editable={editing}
              onChangeText={(t) => setField('fullName', t)}
              placeholder="Имя Фамилия"
              error={errors.fullName}
            />

            <Field
              label="Должность"
              value={editing ? form.jobTitle : profile.jobTitle}
              editable={editing}
              onChangeText={(t) => setField('jobTitle', t)}
              placeholder="Должность"
            />

            <Field
              label="Гражданский номер"
              value={editing ? form.civilNumber : profile.civilNumber}
              editable={editing}
              onChangeText={(t) => setField('civilNumber', t.replace(/[^\d]/g, '').slice(0, 10))}
              placeholder="10 цифр"
              keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' })}
              helper="Ровно 10 цифр"
              error={errors.civilNumber}
            />

            <Field
              label="Телефон"
              value={editing ? form.phone : profile.phone}
              editable={editing}
              onChangeText={(t) => setField('phone', t)}
              placeholder="+7 ..."
              keyboardType={Platform.select({ ios: 'phone-pad', android: 'phone-pad', default: 'default' })}
              error={errors.phone}
            />

            <Field
              label="Email"
              value={editing ? (form.email ?? '') : (profile.email ?? '—')}
              editable={editing}
              onChangeText={(t) => setField('email', t)}
              placeholder="name@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />
          </View>

          {/* Preferences / extras (static demo) */}
          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardTitle}>Предпочтения</Text>
            <Row icon="moon-outline" title="Тема" value="Система" />
            <Row icon="notifications-outline" title="Уведомления" value="Включены" />
            <Row icon="language-outline" title="Язык" value="Русский" />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : null,
            { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

/** Reusable field */
function Field(props: {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  helper?: string;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const {
    label, value, editable, onChangeText, placeholder, keyboardType, helper, error, autoCapitalize,
  } = props;

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, error && { borderColor: '#fca5a5', backgroundColor: '#fff1f2' }]}
        />
      ) : (
        <View style={styles.readonlyBox}>
          <Text style={styles.readonlyText}>{value || '—'}</Text>
        </View>
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!error && !!helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

function Row({ icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Ionicons name={icon} size={16} color="#475569" />
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 12, gap: 10 },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 9999,
    backgroundColor: '#93c5fd',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#0f172a', fontWeight: '900', fontSize: 18 },
  nameText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  jobText: { color: '#dbeafe', fontSize: 12, marginTop: 2 },

  editBtn: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  editBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { fontWeight: '800', fontSize: 12 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
    padding: 12,
    ...cardShadow,
  },
  cardTitle: { color: '#0f172a', fontWeight: '900', fontSize: 14, marginBottom: 6 },

  fieldLabel: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#0f172a', fontSize: 16,
  },
  readonlyBox: {
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  readonlyText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  helperText: { color: '#64748b', fontSize: 11, marginTop: 4 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginTop: 4 },

  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  rowTitle: { color: '#0f172a', fontWeight: '700', flex: 1 },
  rowValue: { color: '#2563eb', fontWeight: '900' },

  toast: {
    position: 'absolute', top: 18, left: 16, right: 16,
    backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  toastText: { color: '#0f172a', fontWeight: '700' },
});
