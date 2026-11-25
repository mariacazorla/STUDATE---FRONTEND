import { ApiError, authService } from '@studate/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Acceso } from '../components/Acceso';
import { Field } from '../components/Field';
import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';
import { errorMessage } from '../utils/api-error';

type RegistroValues = {
  name: string;
  email: string;
  password: string;
  repeat: string;
};

// Las mismas reglas que valida la API con Joi (nombre, correo y contraseña de 8 caracteres como
// mínimo), para avisar antes de enviar. La API las vuelve a comprobar: esto es solo comodidad
function validate(values: RegistroValues) {
  const errors: Partial<Record<keyof RegistroValues, string>> = {};

  if (!values.name.trim()) {
    errors.name = 'Escribe tu nombre.';
  }
  if (!values.email.trim()) {
    errors.email = 'Escribe tu correo.';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Ese correo no tiene forma de correo.';
  }
  if (values.password.length < 8) {
    errors.password = 'La contraseña tiene que tener 8 caracteres como mínimo.';
  }
  if (values.repeat !== values.password) {
    errors.repeat = 'Las dos contraseñas no coinciden.';
  }

  return errors;
}

// Pantalla de registro. La API crea la cuenta (siempre con el rol de estudiante) pero no inicia
// sesión: al terminar se va al login.
export function Registro() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const form = useForm<RegistroValues>({ name: '', email: '', password: '', repeat: '' }, validate);

  const [sending, setSending] = useState(false);
  // emailTaken: la API ha dicho 409, ya hay una cuenta con ese correo
  const [emailTaken, setEmailTaken] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid) {
      return;
    }

    setSending(true);
    setEmailTaken(false);
    setError('');

    try {
      // repeat no se envía: la API no lo conoce y Joi rechaza los campos de más (422)
      await authService.register({
        name: form.values.name.trim(),
        email: form.values.email.trim(),
        password: form.values.password,
      });

      showToast('Cuenta creada. Ya puedes entrar.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailTaken(true);
      } else {
        setError(errorMessage(err));
      }
      setSending(false);
    }
  };

  return (
    <Acceso
      lema={
        <>
          Aquí solo se entra con el <em>correo de la uni.</em>
        </>
      }
      texto="Sin excepciones, sin colarse."
    >
      <form className="pila" onSubmit={handleSubmit} noValidate>
        <h1 className="t1">Crear cuenta</h1>

        {error && (
          <p className="aviso" role="alert">
            {error}
          </p>
        )}

        <Field label="Nombre" htmlFor="registro-name" error={form.errorOf('name')}>
          <input
            id="registro-name"
            name="name"
            autoComplete="name"
            value={form.values.name}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
        </Field>

        <Field
          label="Correo de la universidad"
          htmlFor="registro-email"
          error={
            form.errorOf('email') ??
            (emailTaken ? 'Ya hay una cuenta con este correo. Prueba a entrar.' : undefined)
          }
        >
          <input
            id="registro-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="nombre@estudiantat.upc.edu"
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
        </Field>

        <div className="rejilla dos">
          <Field
            label="Contraseña"
            htmlFor="registro-password"
            error={form.errorOf('password')}
            hint="8 caracteres como mínimo."
          >
            <input
              id="registro-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
            />
          </Field>

          <Field
            label="Repite la contraseña"
            htmlFor="registro-repeat"
            error={form.errorOf('repeat')}
          >
            <input
              id="registro-repeat"
              name="repeat"
              type="password"
              autoComplete="new-password"
              value={form.values.repeat}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
            />
          </Field>
        </div>

        <button type="submit" className="btn entero" disabled={sending}>
          {sending ? 'Creando la cuenta…' : 'Crear cuenta'}
        </button>

        <p className="sua centrado">
          ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </Acceso>
  );
}
