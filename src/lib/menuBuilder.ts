/**
 * FreeFlow Menu Builder v3
 * Generuje strukturę menu w zależności od roli użytkownika i środowiska
 */

export type UserRole = 'client' | 'vendor' | 'admin' | null;

export interface MenuItem {
  id: string;
  to: string;
  label: string;
  icon: string;
  desc?: string;
  highlight?: boolean;
  badge?: number | string;
  requiresAuth?: boolean;
  devOnly?: boolean;
}

export interface MenuSection {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
  requiresAuth?: boolean;
  roles?: UserRole[];
  devOnly?: boolean;
}

export interface User {
  id: string;
  email?: string | null;
  role?: UserRole;
  user_metadata?: {
    role?: UserRole;
    user_type?: string;
  };
}

export interface BuildMenuOptions {
  user: User | null;
  env: 'development' | 'production';
}

/**
 * Określa rolę użytkownika na podstawie danych
 */
export function getUserRole(user: User | null): UserRole {
  if (!user) return null;
  
  // Sprawdź role w różnych miejscach
  if (user.role) return user.role;
  if (user.user_metadata?.role) return user.user_metadata.role;
  if (user.user_metadata?.user_type === 'business') return 'vendor';
  if (user.user_metadata?.user_type === 'admin') return 'admin';
  
  // Domyślnie klient
  return 'client';
}

/**
 * Główna funkcja budująca menu
 */
export function buildMenu({ user, env }: BuildMenuOptions): MenuSection[] {
  const role = getUserRole(user);
  const isDev = env === 'development';
  
  const sections: MenuSection[] = [];

  // === BASE MENU (dla wszystkich) ===
  sections.push({
    id: 'main',
    title: 'Główne',
    icon: '🏠',
    items: [
      {
        id: 'home',
        to: '/',
        label: 'Home',
        icon: '🏠',
        desc: 'Strona główna'
      },
      {
        id: 'discover',
        to: '/discover',
        label: 'Odkrywaj Jedzenie',
        icon: '🍕',
        desc: 'Przeglądaj restauracje'
      },
      {
        id: 'cart',
        to: '/cart',
        label: 'Koszyk',
        icon: '🛒',
        desc: 'Twoje zamówienia'
      }
    ]
  });

  // === CLIENT MENU (zalogowany klient) ===
  if (role === 'client' || role === null) {
    sections.push({
      id: 'client',
      title: 'Klient',
      icon: '👤',
      items: [
        {
          id: 'orders',
          to: '/panel/customer',
          label: 'Zamówienia',
          icon: '📦',
          desc: 'Historia zamówień',
          requiresAuth: true
        },
        {
          id: 'favorites',
          to: '/favorites',
          label: 'Ulubione',
          icon: '❤️',
          desc: 'Ulubione restauracje',
          requiresAuth: true
        },
        {
          id: 'reservations',
          to: '/reservations',
          label: 'Rezerwacje Stolików',
          icon: '🪑',
          desc: 'Ruchome stoliki (wkrótce)',
          badge: '🚧'
        },
        {
          id: 'profile',
          to: '/panel/customer',
          label: 'Profil & Ustawienia',
          icon: '⚙️',
          desc: 'Twoje dane',
          requiresAuth: true
        }
      ]
    });
  }

  // === VENDOR MENU (dla biznesu) ===
  if (role === 'vendor') {
    sections.push({
      id: 'business',
      title: 'Konsola Biznesu',
      icon: '🏪',
      roles: ['vendor'],
      items: [
        {
          id: 'business-dashboard',
          to: '/panel/business',
          label: 'Dashboard Biznesu',
          icon: '📊',
          desc: 'Przegląd działalności',
          requiresAuth: true
        },
        {
          id: 'restaurant-panel',
          to: '/panel/restaurant',
          label: 'Panel Restauracji',
          icon: '🍽️',
          desc: 'Menu i zamówienia',
          requiresAuth: true
        },
        {
          id: 'taxi-panel',
          to: '/panel/taxi',
          label: 'Panel Taxi',
          icon: '🚕',
          desc: 'Przejazdy i kursy',
          requiresAuth: true
        },
        {
          id: 'hotel-panel',
          to: '/panel/hotel',
          label: 'Panel Hotelu',
          icon: '🏨',
          desc: 'Rezerwacje i pokoje',
          requiresAuth: true
        }
      ]
    });
  }

  // === ADMIN MENU (dla administratorów) ===
  if (role === 'admin') {
    sections.push({
      id: 'admin',
      title: 'Panel Admin',
      icon: '👑',
      roles: ['admin'],
      items: [
        {
          id: 'admin-analytics',
          to: '/admin',
          label: 'Analityka',
          icon: '📊',
          desc: 'Statystyki i raporty',
          requiresAuth: true
        },
        {
          id: 'admin-users',
          to: '/admin/users',
          label: 'Użytkownicy',
          icon: '👥',
          desc: 'Zarządzanie kontami',
          requiresAuth: true
        },
        {
          id: 'admin-settings',
          to: '/settings',
          label: 'Ustawienia',
          icon: '⚙️',
          desc: 'Konfiguracja systemu',
          requiresAuth: true
        }
      ]
    });
  }

  // === HELP SECTION (dla wszystkich) ===
  sections.push({
    id: 'help',
    title: 'Pomoc',
    icon: 'ℹ️',
    items: [
      {
        id: 'faq',
        to: '/faq',
        label: 'FAQ',
        icon: '❓',
        desc: 'Często zadawane pytania'
      },
      {
        id: 'voice-toggle',
        to: '#voice-toggle',
        label: '🎙 Voice Toggle',
        icon: '🎤',
        desc: 'Asystent głosowy'
      }
    ]
  });

  // === DEV ONLY SECTIONS ===
  if (isDev) {
    sections.push({
      id: 'labs',
      title: '🔧 Labs (DEV)',
      icon: '🧪',
      devOnly: true,
      items: [
        {
          id: 'dev-logo',
          to: '/logo-demo',
          label: 'Logo Demo',
          icon: '🎭',
          desc: 'Animowane logo FreeFlow',
          devOnly: true,
          highlight: true
        },
        {
          id: 'dev-home-logo',
          to: '/home-new-logo',
          label: 'Home + New Logo',
          icon: '🏠',
          desc: 'Przykład integracji',
          devOnly: true,
          highlight: true
        },
        {
          id: 'dev-sandbox',
          to: '/sandbox',
          label: 'Sandbox',
          icon: '🎨',
          desc: 'Playground komponentów',
          devOnly: true
        },
        {
          id: 'dev-test',
          to: '/test',
          label: 'Test Flow',
          icon: '🧪',
          desc: 'Testy integracyjne',
          devOnly: true
        }
      ]
    });
  }

  return sections;
}

/**
 * Filtruje menu items na podstawie autoryzacji użytkownika
 */
export function filterMenuItems(
  sections: MenuSection[],
  user: User | null
): MenuSection[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Jeśli item wymaga autoryzacji, sprawdź czy user jest zalogowany
        if (item.requiresAuth && !user) {
          return false;
        }
        return true;
      })
    }))
    .filter(section => section.items.length > 0); // Usuń puste sekcje
}

/**
 * Zwraca pełne menu gotowe do wyświetlenia
 */
export function getMenu(user: User | null, env: 'development' | 'production' = 'production'): MenuSection[] {
  const menu = buildMenu({ user, env });
  return filterMenuItems(menu, user);
}

