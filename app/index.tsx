import { Redirect } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';

export default function Index() {
  const { userId } = useTwinStore();
  
  if (userId) {
    return <Redirect href="/welcome" />;
  }
  
  return <Redirect href="/splash" />;
}
