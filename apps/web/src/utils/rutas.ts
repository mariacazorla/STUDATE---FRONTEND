import type { UserRole } from '@studate/shared';

// La pantalla de entrada de cada rol. Solo hay dos roles: el admin entra en el backoffice y el
// estudiante (rol 'user'), en La Orla
export function inicioDe(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/orla';
}
