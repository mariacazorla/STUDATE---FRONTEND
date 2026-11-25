// Un bloqueo: un usuario decide que no quiere volver a ver a otro. Desde entonces ninguno de los dos
// le sale al otro en La Orla ni en los chats, y a la persona bloqueada no se le avisa
export interface Block {
  _id: string;
  // Id de quien bloquea
  blocker: string;
  // Id del usuario bloqueado
  blocked: string;
  createdAt: string;
}

// Lo que se envía al bloquear: a quién. Quién bloquea lo sabe la API por el token
export interface CreateBlock {
  blocked: string;
}
