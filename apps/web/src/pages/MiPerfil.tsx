import { DEGREES, MAX_TRUSTED_CONTACTS, authService, refreshMe, userService } from '@studate/shared';
import type { TrustedContact, UpdateMyProfile } from '@studate/shared';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { Field } from '../components/Field';
import { Icono } from '../components/Icono';
import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';
import { errorMessage, isAbort } from '../utils/api-error';
import { initials } from '../utils/format';
import { imageToDataUrl } from '../utils/image-to-data-url';

// Los campos de texto del formulario (useForm trabaja con strings). La foto y los contactos van aparte,
// porque no son un input de texto
type PerfilValues = {
  name: string;
  birthDate: string;
  degree: string;
  lookingFor: string;
  bio: string;
};

// Las mismas reglas que valida la API con Joi, para avisar antes de enviar
function validate(values: PerfilValues) {
  const errors: Partial<Record<keyof PerfilValues, string>> = {};

  if (!values.name.trim()) {
    errors.name = 'Escribe tu nombre.';
  }
  if (values.lookingFor.length > 100) {
    errors.lookingFor = 'Como mucho 100 caracteres.';
  }
  if (values.bio.length > 500) {
    errors.bio = `La bio no puede pasar de 500 caracteres (llevas ${values.bio.length}).`;
  }

  return errors;
}

// Un contacto vacío, para añadir uno nuevo
const CONTACTO_VACIO: TrustedContact = { name: '', email: '', phone: '' };

// Mi perfil: los ajustes personales del estudiante. Edita su Expediente (nombre, fecha de nacimiento,
// titulación, qué busca y bio), su foto y sus contactos de confianza (opcionales, hasta 3), y cierra
// sesión. El rol no se puede cambiar desde aquí: la API lo rechaza.
export function MiPerfil() {
  const { showToast } = useToast();
  const form = useForm<PerfilValues>(
    { name: '', birthDate: '', degree: '', lookingFor: '', bio: '' },
    validate,
  );

  const [email, setEmail] = useState('');
  // La foto en base64 (o '' si no hay). undefined mientras carga
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [contactos, setContactos] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Al entrar, se rellena el formulario con el perfil actual (GET /users/me)
  useEffect(() => {
    const controller = new AbortController();

    userService
      .getMe(controller.signal)
      .then((user) => {
        form.fill({
          name: user.name,
          // El input de fecha quiere yyyy-mm-dd: me quedo con el día de la fecha ISO
          birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
          degree: user.degree ?? '',
          lookingFor: user.lookingFor ?? '',
          bio: user.bio ?? '',
        });
        setEmail(user.email);
        setPhoto(user.photo ?? '');
        setContactos(user.trustedContacts ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isAbort(err)) {
          setError(errorMessage(err));
          setLoading(false);
        }
      });

    return () => controller.abort();
    // form.fill es estable (useCallback en useForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La foto: se reduce en el navegador antes de guardarla como base64
  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setPhoto(await imageToDataUrl(file));
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  // Los contactos de confianza: una lista pequeña que se edita en sitio
  const cambiarContacto = (i: number, campo: keyof TrustedContact, valor: string) => {
    setContactos((lista) => lista.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)));
  };
  const quitarContacto = (i: number) => setContactos((lista) => lista.filter((_, j) => j !== i));
  const añadirContacto = () => setContactos((lista) => [...lista, { ...CONTACTO_VACIO }]);

  // Un contacto solo se envía si tiene nombre y email; el resto de la fila se queda como está
  const contactosValidos = () =>
    contactos
      .filter((c) => c.name.trim() && c.email.trim())
      .map((c) => ({ name: c.name.trim(), email: c.email.trim(), ...(c.phone?.trim() ? { phone: c.phone.trim() } : {}) }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid) {
      return;
    }

    // Solo se envían los campos opcionales que tienen valor (Joi no acepta cadenas vacías en la fecha
    // ni en la titulación). La bio sí puede ir vacía, y la foto '' quiere decir "quitar la foto"
    const payload: UpdateMyProfile = {
      name: form.values.name.trim(),
      bio: form.values.bio,
      ...(form.values.birthDate ? { birthDate: form.values.birthDate } : {}),
      ...(form.values.degree ? { degree: form.values.degree } : {}),
      ...(form.values.lookingFor.trim() ? { lookingFor: form.values.lookingFor.trim() } : {}),
      ...(photo !== undefined ? { photo } : {}),
      trustedContacts: contactosValidos(),
    };

    setSaving(true);
    setError('');
    try {
      const user = await userService.updateMe(payload);
      // El menú enseña el nombre y la foto de la sesión: se refrescan con lo guardado
      refreshMe(user);
      setContactos(user.trustedContacts ?? []);
      showToast('Cambios guardados.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pila" aria-busy="true">
        <h1 className="t1">Mi perfil</h1>
        <div className="card rellena">
          <span className="esq" style={{ width: '40%' }} />
          <span className="esq" />
          <span className="esq" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  return (
    <form className="pila" onSubmit={handleSubmit} noValidate>
      <div className="fila separada">
        <h1 className="t1">Mi perfil</h1>
        <button type="button" className="btn2" onClick={() => authService.logout()}>
          <Icono nombre="salir" />
          Cerrar sesión
        </button>
      </div>

      {error && (
        <p className="aviso" role="alert">
          {error}
        </p>
      )}

      {/* La foto y el correo (el correo no se cambia: es con lo que se entra) */}
      <section className="card rellena perfil-cab">
        {photo ? (
          <img className="foto-p" src={photo} alt="Tu foto de perfil" />
        ) : (
          <span className="foto-p foto-p-sin">{initials(form.values.name || '?')}</span>
        )}
        <div className="pila junta">
          <span className="et">Foto de perfil</span>
          <div className="fila">
            <label className="btn2">
              Cambiar foto
              <input type="file" accept="image/png,image/jpeg" onChange={onPhoto} className="solo-lectores" />
            </label>
            {photo && (
              <button type="button" className="btn2" onClick={() => setPhoto('')}>
                Quitar
              </button>
            )}
          </div>
          <span className="sua">{email}</span>
        </div>
      </section>

      {/* El Expediente: lo que ven los demás en La Orla */}
      <section className="card rellena pila">
        <h2 className="t2">Mi Expediente</h2>

        <div className="rejilla dos">
          <Field label="Nombre" htmlFor="perfil-name" error={form.errorOf('name')}>
            <input id="perfil-name" name="name" value={form.values.name} onChange={form.handleChange} onBlur={form.handleBlur} />
          </Field>

          <Field label="Fecha de nacimiento" htmlFor="perfil-birthDate" hint="Con ella se calcula tu edad.">
            <input id="perfil-birthDate" name="birthDate" type="date" value={form.values.birthDate} onChange={form.handleChange} />
          </Field>

          <Field label="Titulación" htmlFor="perfil-degree">
            <select id="perfil-degree" name="degree" value={form.values.degree} onChange={form.handleChange}>
              <option value="">Sin indicar</option>
              {DEGREES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Qué busco" htmlFor="perfil-lookingFor" error={form.errorOf('lookingFor')} hint="Como mucho 100 caracteres.">
            <input id="perfil-lookingFor" name="lookingFor" value={form.values.lookingFor} onChange={form.handleChange} onBlur={form.handleBlur} maxLength={100} />
          </Field>
        </div>

        <Field label="Bio" htmlFor="perfil-bio" error={form.errorOf('bio')} hint={`${form.values.bio.length}/500`}>
          <textarea id="perfil-bio" name="bio" value={form.values.bio} onChange={form.handleChange} onBlur={form.handleBlur} />
        </Field>
      </section>

      {/* Los contactos de confianza: opcionales, hasta 3 */}
      <section className="card rellena pila">
        <div className="fila separada">
          <h2 className="t2">Contactos de confianza</h2>
          <span className="chip azul">{contactos.length} de {MAX_TRUSTED_CONTACTS}</span>
        </div>
        <p className="sua">
          Son opcionales. Si pides ayuda durante un Date, se les avisa a ellos y a los administradores. Solo los ves tú.
        </p>

        {contactos.length === 0 && (
          <div className="vacio">
            <b>Todavía no tienes contactos de confianza.</b>
            <span className="sua">Puedes seguir sin ellos: el botón de ayuda avisa igualmente a los administradores.</span>
          </div>
        )}

        {contactos.map((c, i) => (
          <div key={i} className="contacto card">
            <div className="rejilla dos">
              <Field label="Nombre" htmlFor={`contacto-${i}-name`}>
                <input id={`contacto-${i}-name`} value={c.name} onChange={(e) => cambiarContacto(i, 'name', e.target.value)} placeholder="Marta (hermana)" />
              </Field>
              <Field label="Correo" htmlFor={`contacto-${i}-email`}>
                <input id={`contacto-${i}-email`} type="email" value={c.email} onChange={(e) => cambiarContacto(i, 'email', e.target.value)} placeholder="marta@example.com" />
              </Field>
              <Field label="Teléfono (opcional)" htmlFor={`contacto-${i}-phone`}>
                <input id={`contacto-${i}-phone`} value={c.phone ?? ''} onChange={(e) => cambiarContacto(i, 'phone', e.target.value)} placeholder="600 000 000" />
              </Field>
            </div>
            <button type="button" className="btn2" onClick={() => quitarContacto(i)}>
              Quitar contacto
            </button>
          </div>
        ))}

        {contactos.length < MAX_TRUSTED_CONTACTS && (
          <div className="fila">
            <button type="button" className="btn2" onClick={añadirContacto}>
              Añadir contacto
            </button>
          </div>
        )}
      </section>

      <div className="fila">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
