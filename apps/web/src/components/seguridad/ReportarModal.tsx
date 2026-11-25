import { REPORT_REASON_LABELS, reportService } from '@studate/shared';
import type { ReportReason } from '@studate/shared';
import { useState } from 'react';

import { errorMessage } from '../../utils/api-error';
import { Icono } from '../Icono';
import { Ventana } from '../Ventana';

interface ReportarModalProps {
  // Sobre quién
  user: { _id: string; name: string };
  // Desde qué Date, si se manda desde un chat
  dateId?: string;
  onCancel: () => void;
  onSent: () => void;
  // Atajo a bloquear desde la misma ventana
  onBlock: () => void;
}

// Los motivos en el orden de la plantilla, con el texto que ve el estudiante
const MOTIVOS: { value: ReportReason; texto: string }[] = [
  { value: 'harassment', texto: 'Acoso o insultos' },
  { value: 'fake_profile', texto: REPORT_REASON_LABELS.fake_profile },
  { value: 'inappropriate', texto: REPORT_REASON_LABELS.inappropriate },
  { value: 'other', texto: 'Otro motivo' },
];

// La ventana de mandar un parte: el motivo (obligatorio), un comentario opcional y, al lado, el atajo
// de bloquear. El parte va al admin, que decide qué hacer según la gravedad
export function ReportarModal({ user, dateId, onCancel, onSent, onBlock }: ReportarModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const nombre = user.name.split(' ')[0];

  const enviar = async () => {
    if (!reason) {
      setError('Elige un motivo para poder enviar el parte.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await reportService.create({
        reported: user._id,
        reason,
        ...(dateId ? { date: dateId } : {}),
        ...(text.trim() ? { text: text.trim() } : {}),
      });
      onSent();
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  };

  return (
    <Ventana label="Mandar un parte" onClose={onCancel}>
      <span className="et">Mandar un parte</span>
      <b className="t-ventana">¿Qué ha pasado con {nombre}?</b>

      <div className="opciones" role="radiogroup" aria-label="Motivo">
        {MOTIVOS.map((motivo) => (
          <label key={motivo.value} className={reason === motivo.value ? 'sel' : undefined}>
            <input
              type="radio"
              name="motivo"
              value={motivo.value}
              checked={reason === motivo.value}
              onChange={() => {
                setReason(motivo.value);
                setError('');
              }}
            />
            {motivo.texto}
          </label>
        ))}
      </div>

      <div className="campo">
        <label htmlFor="parte-texto">Cuéntanos (opcional)</label>
        <textarea
          id="parte-texto"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ height: 72 }}
        />
      </div>

      {error && <div className="aviso">{error}</div>}

      <div className="botonera">
        <button type="button" className="btn2" onClick={onBlock} disabled={sending}>
          <Icono nombre="bloquear" />
          Bloquear
        </button>
        <button type="button" className="btn" onClick={enviar} disabled={sending}>
          <Icono nombre="bandera" />
          {sending ? 'Enviando…' : 'Enviar parte'}
        </button>
      </div>
    </Ventana>
  );
}
