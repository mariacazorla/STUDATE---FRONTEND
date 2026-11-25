import { safetyAlertService, userService } from '@studate/shared';
import { useEffect, useState } from 'react';

import { errorMessage, isAbort } from '../../utils/api-error';
import { Icono } from '../Icono';
import { Ventana } from '../Ventana';

interface AyudaModalProps {
  // Desde qué Date se pide ayuda, para que el admin sepa con quién estaba
  dateId: string;
  onCancel: () => void;
  // Ayuda pedida: a cuántos contactos de confianza se ha avisado
  onSent: (contactsNotified: number) => void;
}

type Estado = 'normal' | 'enviando' | 'error';

// La ventana del botón de ayuda. Es la única acción de peligro de la app, por eso va en rojo. Explica a
// quién se va a avisar (los contactos de confianza, si los hay, y el equipo de Studate), deja escribir
// unas palabras opcionales y recuerda el 112. Quien pide ayuda no está para formularios: un solo toque
// para confirmar
export function AyudaModal({ dateId, onCancel, onSent }: AyudaModalProps) {
  const [estado, setEstado] = useState<Estado>('normal');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Cuántos contactos de confianza tengo. null mientras se mira (la ventana no espera a saberlo)
  const [contactos, setContactos] = useState<number | null>(null);

  // Los contactos solo vienen en GET /users/me: se piden al abrir, para decir a cuántos se avisará
  useEffect(() => {
    const controller = new AbortController();
    userService
      .getMe(controller.signal)
      .then((me) => setContactos(me.trustedContacts?.length ?? 0))
      .catch((err) => {
        if (!isAbort(err)) {
          setContactos(0);
        }
      });
    return () => controller.abort();
  }, []);

  const pedir = async () => {
    setEstado('enviando');
    setError('');
    try {
      const res = await safetyAlertService.create({
        date: dateId,
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      onSent(res.contactsNotified);
    } catch (err) {
      setError(errorMessage(err));
      setEstado('error');
    }
  };

  const sinContactos = contactos === 0;

  return (
    <Ventana label="Botón de ayuda" onClose={onCancel}>
      <span className="et peligro">Botón de ayuda</span>

      {sinContactos ? (
        <>
          <b className="t-ventana">Aún no tienes contactos de confianza.</b>
          <span className="sua">
            Avisaremos al equipo de Studate con el Date en el que estás. Añade contactos en Mi perfil
            para que también les llegue.
          </span>
        </>
      ) : (
        <>
          <b className="t-ventana">¿Necesitas ayuda?</b>
          <span className="sua">
            Avisaremos ahora{' '}
            {contactos === null
              ? 'a tus contactos de confianza'
              : `a ${contactos === 1 ? 'tu contacto' : `tus ${contactos} contactos`} de confianza`}{' '}
            y al equipo de Studate, con el Date en el que estás.
          </span>
        </>
      )}

      <div className="campo">
        <label htmlFor="ayuda-msg">Mensaje (opcional)</label>
        <input
          id="ayuda-msg"
          maxLength={300}
          placeholder="Por ejemplo: estoy en la terraza de la EETAC"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="urg">
        <Icono nombre="escudo" />
        <span>
          Si estás en peligro, llama al <b>112</b>.
        </span>
      </div>

      {estado === 'error' && (
        <div className="aviso">
          {error || 'No se ha podido enviar el aviso.'} Vuelve a pulsar. Si no hay conexión, llama al 112.
        </div>
      )}

      <div className="botonera">
        <button type="button" className="btn2" onClick={onCancel} disabled={estado === 'enviando'}>
          Cancelar
        </button>
        <button type="button" className="btn peligro" onClick={pedir} disabled={estado === 'enviando'}>
          <Icono nombre="escudo" />
          {estado === 'enviando'
            ? 'Enviando el aviso…'
            : estado === 'error'
              ? 'Volver a enviar'
              : sinContactos
                ? 'Pedir ayuda igualmente'
                : 'Pedir ayuda'}
        </button>
      </div>
    </Ventana>
  );
}
