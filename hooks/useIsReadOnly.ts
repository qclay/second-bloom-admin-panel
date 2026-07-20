import { useAuthStore } from '@/lib/auth-store';

/**
 * True when the current user has read-only access (FINANCIST role).
 * Use to hide create/edit/delete controls; the API client and the backend
 * both reject write requests for this role anyway.
 */
export function useIsReadOnly(): boolean {
  const role = useAuthStore((state) => state.user?.role);
  return role === 'FINANCIST';
}
