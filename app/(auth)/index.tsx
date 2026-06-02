import { Redirect } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function AuthIndex() {
  const { user } = useAuthStore();

  if (user) {
    if (!user.username) {
      return <Redirect href="/(auth)/choose-username" />;
    }
    if (!user.has_onboarded) {
      return <Redirect href="/(auth)/preferences" />;
    }
    return <Redirect href="/(tabs)/feed" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
