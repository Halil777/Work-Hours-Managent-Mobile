import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import AppTabs from './AppTabs';
import AuthStack from './AuthStack';

export default function RootNavigation() {
  const token = useAuthStore(s => s.token);
  return (
    <NavigationContainer>
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
