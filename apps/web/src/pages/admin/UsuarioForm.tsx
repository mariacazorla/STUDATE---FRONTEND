import { ApiError, DEGREES, userService } from '@studate/shared';
import type { CreateUser, UpdateUser, User, UserRole } from '@studate/shared';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ConfirmModal } from '../../components/ConfirmModal';
import { Field } from '../../components/Field';
import { Icono } from '../../components/Icono';
import { useToast } from '../../context/ToastContext';
import { useForm } from '../../hooks/useForm';
import { errorMessage, isAbort } from '../../utils/api-error';
import { initials } from '../../utils/format';
import { imageToDataUrl } from '../../utils/image-to-data-url';

// Los campos de texto del formulario. La foto y "activo" van aparte (no son inputs de texto)
type UsuarioValues = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  birthDate: string;
  degree: string;
  lookingFor: string;
  bio: string;
};

const VACIO: UsuarioValues = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  birthDate: '',
  degree: '',
  lookingFor: '',
  bio: '',
};

// Las mismas reglas que valida la API con Joi, para avisar antes de enviar. La contraseña solo se
// pide al crear (desde el backoffice no se cambia)
function validar(esNuevo: boolean) {
  return (values: UsuarioValues) => {
    const errors: Partial<Record<keyof UsuarioValues, string>> = {};
    if (!values.name.trim()) {
      errors.name = 'Escribe el nombre.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = 'Escribe un correo válido.';
    }
    if (esNuevo && values.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres.';
    }
    if (values.lookingFor.length > 100) {
      errors.lookingFor = 'Como mucho 100 caracteres.';
    }
    if (values.bio.length > 500) {
      errors.bio = 'Como mucho 500 caracteres.';
    }
    return errors;
  };
}

type Estado = 'cargando' | 'normal' | 'error';

// El formulario de usuario del backoffice: crear (/admin/usuarios/nuevo) y editar (/admin/usuarios/:id).
// A diferencia del registro, el admin elige el rol y si la cuenta está activa, y puede poner la foto.
// Desde aquí también se archiva, se restaura y se elimina (solo si está archivado)
export function UsuarioForm() {
  const { userId } = useParams<{ userId: string }>();
  const esNuevo = !userId;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const form = useForm<UsuarioValues>(VACIO, validar(esNuevo));
  const [estado, setEstado] = useState<Estado>(esNuevo ? 'normal' : 'cargando');
  const [usuario, setUsuario] = useState<User | null>(null);
  const [active, setActive] = useState(true);
  // La foto en base64, '' si se quita y undefined si no se ha tocado
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [errorApi, setErrorApi] = useState('');
  const [confirmar, setConfirmar] = useState<'archivar' | 'restaurar' | 'eliminar' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { fill } = form;

  // Al editar, se rellena con el usuario (también si está inactivo o archivado)
  useEffect(() => {
    if (!userId) {
      return;
    }
    const controller = new AbortController();
    userService
      .getUser(userId, controller.signal)
      .then((user) => {
        setUsuario(user);
        setActive(user.active !== false);
        setPhoto(user.photo ?? '');
        fill({
          name: user.name,
          email: user.email,
          role: user.role,
          birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
          degree: user.degree ?? '',
          lookingFor: user.lookingFor ?? '',
          bio: user.bio ?? '',
        });
        setEstado('normal');
      })
      .catch((err) => {
        if (!isAbort(err)) {
          setEstado('error');
        }
      });
    return () => controller.abort();
  }, [userId, fill]);

  const elegirFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }
    try {
      setPhoto(await imageToDataUrl(file));
    } catch {
      showToast('No se ha podido leer la imagen.');
    }
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid) {
      return;
    }
    setSaving(true);
    setErrorApi('');
    const v = form.values;
    // Los campos opcionales solo se envían si tienen valor (Joi no acepta '' en la fecha ni la titulación)
    const perfil = {
      role: v.role,
      active,
      ...(v.birthDate ? { birthDate: v.birthDate } : {}),
      ...(v.degree ? { degree: v.degree } : {}),
      ...(v.lookingFor.trim() ? { lookingFor: v.lookingFor.trim() } : {}),
      bio: v.bio.trim(),
      ...(photo !== undefined ? { photo } : {}),
    };
    try {
      if (esNuevo) {
        const payload: CreateUser = { name: v.name.trim(), email: v.email.trim(), password: v.password, ...perfil };
        await userService.createUser(payload);
        showToast('Usuario creado.');
      } else {
        const payload: UpdateUser = { name: v.name.trim(), email: v.email.trim(), ...perfil };
        await userService.updateUser(userId, payload);
        showToast('Cambios guardados.');
      }
      navigate('/admin/usuarios');
    } catch (err) {
      // 409: el correo ya existe. 403: un admin no puede tocarse el rol ni desactivarse a sí mismo
      setErrorApi(err instanceof ApiError && err.status === 409 ? 'Ya hay otra cuenta con este correo.' : errorMessage(err));
      setSaving(false);
    }
  };

  // Archivar, restaurar y eliminar, tras confirmar
  const accion = async () => {
    if (!confirmar || !userId) {
      return;
    }
    const tipo = confirmar;
    setConfirmar(null);
    try {
      if (tipo === 'archivar') {
        setUsuario(await userService.archiveUser(userId));
        showToast('Usuario archivado.');
      } else if (tipo === 'restaurar') {
        setUsuario(await userService.restoreUser(userId));
        showToast('Usuario restaurado.');
      } else {
        await userService.deleteUser(userId);
        showToast('Usuario eliminado para siempre.');
        navigate('/admin/usuarios');
      }
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const nombre = usuario?.name.split(' ')[0] ?? '';

  return (
    <div className="pila" style={{ maxWidth: 860 }}>
      <div className="bo-cab">
        <div className="pila junta">
          <div className="fila">
            <button type="button" className="btn2" onClick={() => navigate('/admin/usuarios')}>
              <Icono nombre="volver" />
              Usuarios
            </button>
          </div>
          <h1 className="t1">{esNuevo ? 'Nuevo usuario' : 'Editar usuario'}</h1>
        </div>
      </div>

      {estado === 'cargando' && <span className="esq alto" style={{ height: 320 }} aria-busy="true" />}

      {estado === 'error' && (
        <div className="vacio">
          <b>No hemos podido cargar el usuario.</b>
          <button type="button" className="btn2" onClick={() => navigate('/admin/usuarios')}>
            Volver a la lista
          </button>
        </div>
      )}

      {estado === 'normal' && (
        <form className="pila" onSubmit={guardar} noValidate>
          <div className="card rellena pila">
            <div className="perfil-cab">
              {photo ? (
                <img className="foto-p" src={photo} alt="" style={{ width: 72, height: 72 }} />
              ) : (
                <span className="foto-p foto-p-sin" style={{ width: 72, height: 72, fontSize: 22 }}>
                  {initials(form.values.name || '?')}
                </span>
              )}
              <div className="fila">
                <button type="button" className="btn2" onClick={() => fileRef.current?.click()}>
                  {photo ? 'Cambiar foto' : 'Poner foto'}
                </button>
                {photo && (
                  <button type="button" className="btn2" onClick={() => setPhoto('')}>
                    Quitar
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={elegirFoto} />
              </div>
            </div>

            <div className="rejilla dos">
              <Field label="Nombre" htmlFor="u-name" error={form.errorOf('name')}>
                <input id="u-name" name="name" value={form.values.name} onChange={form.handleChange} onBlur={form.handleBlur} />
              </Field>
              <Field label="Correo" htmlFor="u-email" error={form.errorOf('email')}>
                <input id="u-email" name="email" type="email" value={form.values.email} onChange={form.handleChange} onBlur={form.handleBlur} />
              </Field>
              {esNuevo && (
                <Field label="Contraseña" htmlFor="u-password" error={form.errorOf('password')} hint="Mínimo 8 caracteres.">
                  <input
                    id="u-password"
                    name="password"
                    type="password"
                    value={form.values.password}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                  />
                </Field>
              )}
              <Field label="Rol" htmlFor="u-role">
                <select id="u-role" name="role" value={form.values.role} onChange={form.handleChange}>
                  <option value="user">Estudiante</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="Titulación" htmlFor="u-degree">
                <select id="u-degree" name="degree" value={form.values.degree} onChange={form.handleChange}>
                  <option value="">Sin titulación</option>
                  {DEGREES.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="u-birth">
                <input id="u-birth" name="birthDate" type="date" value={form.values.birthDate} onChange={form.handleChange} />
              </Field>
              <Field label="Qué busca" htmlFor="u-looking" error={form.errorOf('lookingFor')}>
                <input id="u-looking" name="lookingFor" maxLength={100} value={form.values.lookingFor} onChange={form.handleChange} onBlur={form.handleBlur} />
              </Field>
            </div>

            <Field label="Bio" htmlFor="u-bio" error={form.errorOf('bio')}>
              <textarea id="u-bio" name="bio" maxLength={500} value={form.values.bio} onChange={form.handleChange} onBlur={form.handleBlur} />
            </Field>

            <label className="marcar-linea">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Cuenta activa (si no, no puede entrar)
            </label>
          </div>

          {errorApi && (
            <div className="aviso" role="alert">
              {errorApi}
            </div>
          )}

          {!esNuevo && usuario && (
            <div className="card peligro-z">
              {usuario.deleted ? (
                <>
                  <div>
                    <b>{nombre} está archivado</b>
                    <div className="sua">Restáuralo para que vuelva a aparecer, o elimínalo para siempre.</div>
                  </div>
                  <div className="fila">
                    <button type="button" className="btn2" onClick={() => setConfirmar('restaurar')}>
                      Restaurar
                    </button>
                    <button type="button" className="btn peligro" onClick={() => setConfirmar('eliminar')}>
                      Eliminar para siempre
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <b>Archivar a {nombre}</b>
                    <div className="sua">Deja de aparecer y no puede entrar. Se puede restaurar.</div>
                  </div>
                  <button type="button" className="btn2 peligro" onClick={() => setConfirmar('archivar')}>
                    Archivar
                  </button>
                </>
              )}
            </div>
          )}

          <div className="botonera">
            <button type="button" className="btn2" onClick={() => navigate('/admin/usuarios')} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando…' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      <ConfirmModal
        open={confirmar !== null}
        title={confirmar === 'archivar' ? `¿Archivar a ${nombre}?` : confirmar === 'restaurar' ? `¿Restaurar a ${nombre}?` : `¿Eliminar a ${nombre} para siempre?`}
        message={
          confirmar === 'eliminar'
            ? 'Se borra de la base de datos con sus votos, Dates y mensajes. Esto no se puede deshacer.'
            : confirmar === 'archivar'
              ? 'Deja de aparecer y no puede entrar. Se puede restaurar.'
              : 'Vuelve a aparecer y puede entrar.'
        }
        confirmText={confirmar === 'archivar' ? 'Archivar' : confirmar === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        onConfirm={accion}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}
