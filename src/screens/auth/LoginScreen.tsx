// app/screens/LoginScreen.tsx (ýa-da öňki LoginScreen ýerleşýän ýeriňiz)
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';

export default function LoginScreen() {
  const [fullName, setFullName] = useState('');
  const [civilNumber, setCivilNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const doLogin = useAuthStore(s => s.login);

  // --- Animasiýa üçin baha
  const anim = useRef(new Animated.Value(0)).current;
  const runStatusAnim = () => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 140,
    }).start();
  };

  useEffect(() => {
    if (status !== 'idle') runStatusAnim();
  }, [status]);

  // --- Girizmeleri arassa saklamak
  const onChangeFullName = (v: string) => {
    // köp boşluklary birine getirýäris
    setFullName(v.replace(/\s+/g, ' '));
  };
  const onChangeCivil = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    setCivilNumber(digits);
  };

  // --- Wali­dasiýa: ady we familiýasy we 10 san
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length < 2) e.fullName = 'Укажите имя и фамилию';
    if (civilNumber.length !== 10) e.civil = 'Гражданский номер должен состоять из 10 цифр';
    return e;
  }, [fullName, civilNumber]);

  const isValid = Object.keys(errors).length === 0 && !submitting;

  const onSubmit = async () => {
    if (!isValid) {
      // ilkinji ýalňyşlygy görkezýäris
      const first = Object.values(errors)[0];
      setStatus('error');
      setErrorMsg(first);
      return;
    }
    try {
      setSubmitting(true);
      setStatus('idle');
      setErrorMsg(null);

      // Backend taýýar bolýança sünnî "login":
      await new Promise(r => setTimeout(r, 600));

      // Üstünlik — stor-a ýazýarys (email ýok bolsa boş edip geçirýäris)
      doLogin('demo-token', { id: 'u1', name: fullName.trim(), email: '' });

      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? 'Не удалось выполнить вход');
    } finally {
      setSubmitting(false);
    }
  };

  // animasiýa stiliniň hasaplamasy
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Вход</Text>
            <Text style={styles.subtitle}>
              Пожалуйста, укажите ваши данные.
            </Text>

            {/* Полное имя */}
            <View style={styles.field}>
              <Text style={styles.label}>Полное имя</Text>
              <TextInput
                placeholder="Имя Фамилия"
                value={fullName}
                onChangeText={onChangeFullName}
                autoCapitalize="words"
                style={[styles.input, errors.fullName && styles.inputError]}
                returnKeyType="next"
                onSubmitEditing={() => { /* fokus aşakdaky inputa ellik geçirip bolýar */ }}
              />
              {errors.fullName ? (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              ) : (
                <Text style={styles.helperText}>Укажите имя и фамилию</Text>
              )}
            </View>

            {/* Гражданский номер */}
            <View style={styles.field}>
              <Text style={styles.label}>Гражданский номер</Text>
              <TextInput
                placeholder="Только цифры (10)"
                value={civilNumber}
                onChangeText={onChangeCivil}
                keyboardType="number-pad"
                maxLength={10}
                style={[styles.input, errors.civil && styles.inputError]}
                returnKeyType="done"
              />
              <View style={styles.helperRow}>
                <Text style={styles.helperText}>Длина: {civilNumber.length} / 10</Text>
                {errors.civil ? (
                  <Text style={styles.errorText}>{errors.civil}</Text>
                ) : null}
              </View>
            </View>

            {/* Status ikonka (animasiýaly) */}
            {status !== 'idle' && (
              <Animated.View
                style={[
                  styles.statusWrap,
                  { opacity, transform: [{ scale }] },
                ]}
              >
                {status === 'success' ? (
                  <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
                ) : (
                  <Ionicons name="close-circle" size={28} color="#ef4444" />
                )}
                <Text
                  style={[
                    styles.statusText,
                    status === 'success' ? styles.successText : styles.errorTextStrong,
                  ]}
                >
                  {status === 'success' ? 'Успешно' : (errorMsg ?? 'Ошибка')}
                </Text>
              </Animated.View>
            )}

            {/* Кнопка */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSubmit}
              disabled={!isValid}
              style={[styles.button, !isValid && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Подождите…' : 'Войти'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.footer}>
              Продолжая, вы подтверждаете корректность введённых данных.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#0f172a' }, // fon — kuwwatly (slate-900)
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#475569' },
  field: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#ef4444' },
  helperRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  helperText: { color: '#64748b', fontSize: 12 },
  errorText: { color: '#ef4444', fontSize: 12 },
  errorTextStrong: { color: '#ef4444', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  statusWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusText: { marginLeft: 8, fontWeight: '700' },
  successText: { color: '#16a34a' },
  button: {
    marginTop: 18,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 14, fontSize: 12, color: '#64748b' },
});
