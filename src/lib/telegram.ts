import { retrieveLaunchParams, init } from '@telegram-apps/sdk';

export function initTelegram() {
  try {
    init();
    // Expand WebApp to full height
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.expand();
    }
  } catch (err) {
    console.warn('Telegram SDK not available, continuing in browser mode...');
  }
}

export function getTelegramUser() {
  try {
    const { initDataRaw, initData } = retrieveLaunchParams();
    return { initDataRaw, user: initData?.user };
  } catch (err) {
    // In production, return null so the app shows a proper "open in Telegram" message
    if (!import.meta.env.DEV) {
      console.warn('Could not retrieve Telegram launch params', err);
      return { initDataRaw: null, user: null };
    }
    
    // Manual mock for local Chrome development only
    console.warn('DEV MODE: Using mock Telegram user for local testing');
    const mockUser = {
      id: 99281932,
      firstName: 'Andrew',
      lastName: 'Rogue',
      username: 'rogue',
      languageCode: 'en',
      isPremium: true,
      allowsWriteToPm: true,
    };
    
    const mockInitDataRaw = new URLSearchParams([
      ['user', JSON.stringify({
        id: 99281932,
        first_name: 'Andrew',
        last_name: 'Rogue',
        username: 'rogue',
        language_code: 'en',
        is_premium: true,
        allows_write_to_pm: true,
      })],
      ['hash', 'mock_hash'],
      ['auth_date', Math.floor(Date.now()/1000).toString()],
      ['start_param', 'debug'],
      ['chat_type', 'sender'],
      ['chat_instance', '8428209589180549439'],
    ]).toString();

    return { initDataRaw: mockInitDataRaw, user: mockUser };
  }
}

export function closeTelegramApp() {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    (window as any).Telegram.WebApp.close();
  }
}
