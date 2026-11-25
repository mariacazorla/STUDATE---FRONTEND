import type { Block, MyBlock, StudateDate } from '../models';
import { request } from './http';

// Los bloqueos (/blocks), solo para el estudiante. Quién bloquea lo sabe la API por el token.
// A la persona bloqueada no se le avisa: la API no tiene ninguna ruta con la que pueda saberlo
export const blockService = {
  /** GET /blocks: a quién he bloqueado */
  getMyBlocks: (signal?: AbortSignal) =>
    request<{ blocks: MyBlock[] }>('/blocks', { signal }).then((res) => res.blocks),

  /** POST /blocks: bloquear a alguien. Devuelve el bloqueo y el Date que se ha cerrado con él (null
   *  si no había ninguno). 409 si ya estaba bloqueado */
  block: (blocked: string) =>
    request<{ block: Block; date: StudateDate | null }>('/blocks', {
      method: 'POST',
      body: JSON.stringify({ blocked }),
    }),

  /** DELETE /blocks/:userId: quitar un bloqueo mío (el Date cerrado no se reabre) */
  unblock: (userId: string) => request<void>(`/blocks/${userId}`, { method: 'DELETE' }),
};
