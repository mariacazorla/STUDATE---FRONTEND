import { ApiError, authService } from '@studate/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Acceso } from '../components/Acceso';
import { Field } from '../components/Field';
import { Icono } from '../components/Icono';
import { useForm } from '../hooks/useForm';
import { errorMessage } from '../utils/api-error';
import { inicioDe } from '../utils/rutas';

// Validación del formulario: devuelve un texto de error por campo (o nada si está bien).
// Va fuera del componente porque no depende de nada suyo
function validate(values: { email: string; password: string }) {
  const errors: Partial<Record<'email' | 'password', string>> = {};

  if (!values.email.trim()) {
    errors.email = 'Escribe tu correo.';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Ese correo no tiene forma de correo.';
  }
  if (!values.password) {
    errors.password = 'Escribe tu contraseña.';
  }

  return errors;
}

// Pantalla de login. Si las credenciales son correctas, authService.login guarda la sesión y se
// entra en la pantalla del rol: el estudiante en La Orla y el admin en el backoffice.
export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ email: '', password: '' }, validate);

  // sending: mientras la API responde, el botón se desactiva para no enviar dos veces
  const [sending, setSending] = useState(false);
  // badCredentials: la API ha dicho 401. error: cualquier otro fallo (por ejemplo, sin conexión)
  const [badCredentials, setBadCredentials] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    // Sin esto el navegador recargaría la página al enviar el formulario
    e.preventDefault();
    form.touchAll();
    if (!form.isValid) {
      return;
    }

    setSending(true);
    setBadCredentials(false);
    setError('');

    try {
      const user = await authService.login({
        email: form.values.email.trim(),
        password: form.values.password,
      });

      // Si venía de una pantalla protegida (la ruta lo guarda en state.from), vuelve a ella;
      // si no, a la pantalla de entrada de su rol. replace: el login no se queda en el historial
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? inicioDe(user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setBadCredentials(true);
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
          Ligar también da <em>créditos.</em>
        </>
      }
      texto="La app para conocer gente de tu universidad."
    >
      {/* noValidate: los errores los enseña React con useForm, no el navegador */}
      <form className="pila" onSubmit={handleSubmit} noValidate>
        <h1 className="t1">Entrar</h1>

        {error && (
          <p className="aviso" role="alert">
            {error}
          </p>
        )}

        <Field
          label="Correo de la universidad"
          htmlFor="login-email"
          error={form.errorOf('email')}
          invalid={badCredentials}
        >
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="nombre@estudiantat.upc.edu"
            value={form.values.email}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="login-password"
          error={
            form.errorOf('password') ??
            (badCredentials
              ? 'El correo o la contraseña no son correctos. Revisa los dos y vuelve a probar.'
              : undefined)
          }
        >
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.values.password}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
        </Field>

        <button type="submit" className="btn entero" disabled={sending}>
          {sending ? 'Entrando…' : 'Entrar'}
          {!sending && <Icono nombre="enviar" />}
        </button>

        <p className="sua centrado">
          ¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link>
        </p>
      </form>
    </Acceso>
  );
}
