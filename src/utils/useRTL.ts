import { useTwinStore } from '../store/useTwinStore';

export function useRTL() {
  const lang = useTwinStore(s => s.lang);
  return {
    isRTL: (lang as string) === 'ar',
    flexDirection: ((lang as string) === 'ar' ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
    textAlign: ((lang as string) === 'ar' ? 'right' : 'left') as 'right' | 'left',
    writingDirection: ((lang as string) === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  };
}
