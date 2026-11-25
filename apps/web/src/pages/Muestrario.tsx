import { useState } from 'react';

import { ConfirmModal } from '../components/ConfirmModal';
import { Field } from '../components/Field';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';

// Muestrario del CSS global: todas las piezas de global.css y componentes.css en una sola página
// (/estilos). Sirve para dos cosas: comprobar de un vistazo que el tema se ve bien en portátil y en
// móvil, y saber qué clases hay ya antes de hacer una pantalla nueva. No llama a la API.
export function Muestrario() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="pila">
      <header className="pila junta">
        <span className="et">CSS global</span>
        <h1 className="t1">Muestrario de Studate</h1>
        <p className="sua">
          Las pantallas solo maquetan con estas clases. Ninguna define colores ni tipografías
          propias.
        </p>
      </header>

      <section className="card rellena pila">
        <h2 className="t2">Tipografía</h2>
        <p className="t1">Titular .t1</p>
        <p className="t2">Titular .t2</p>
        <p className="et">Etiqueta .et</p>
        <p>Texto normal del cuerpo.</p>
        <p className="sua">Texto secundario .sua</p>
      </section>

      <section className="card rellena pila">
        <h2 className="t2">Botones y chips</h2>
        <div className="fila">
          <button type="button" className="btn" onClick={() => showToast('Aviso de ejemplo')}>
            Principal
          </button>
          <button type="button" className="btn2">
            Secundario
          </button>
          <button type="button" className="btn peligro" onClick={() => setConfirmOpen(true)}>
            Eliminar
          </button>
          <button type="button" className="btn" disabled>
            Desactivado
          </button>
        </div>
        <div className="fila">
          <span className="chip">Chip</span>
          <span className="chip azul">Pendiente</span>
          <span className="chip ok">A+</span>
          <span className="chip ko">F</span>
          <span className="chip maiz">Class of 2026</span>
          <span className="ini-av">LP</span>
        </div>
      </section>

      <section className="card rellena pila">
        <h2 className="t2">Campos</h2>
        <div className="rejilla dos">
          <Field label="Correo de la universidad" htmlFor="m-mail" hint="El que te dio la uni.">
            <input id="m-mail" type="email" placeholder="nombre@estudiantat.upc.edu" />
          </Field>
          <Field label="Contraseña" htmlFor="m-pass" error="Mínimo 8 caracteres.">
            <input id="m-pass" type="password" defaultValue="123" />
          </Field>
          <Field label="Titulación" htmlFor="m-tit">
            <select id="m-tit">
              <option>Grau en Enginyeria Telemàtica</option>
              <option>Grau en Enginyeria Aeroespacial</option>
            </select>
          </Field>
          <Field label="Bio" htmlFor="m-bio">
            <textarea id="m-bio" defaultValue="Siempre en la biblioteca de la EETAC." />
          </Field>
        </div>
        <p className="aviso">El correo o la contraseña no son correctos.</p>
        <p className="aviso ok">Cambios guardados.</p>
      </section>

      <section className="card">
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Titulación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Laia Puig</td>
                <td>Telemàtica</td>
                <td>
                  <span className="chip ok">Activa</span>
                </td>
              </tr>
              <tr>
                <td>Pau Ferrer</td>
                <td>Aeroespacial</td>
                <td>
                  <span className="chip ko">Inactivo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={3} onPageChange={setPage} />
      </section>

      <section className="rejilla dos">
        <div className="vacio">
          <b>Todavía no tienes Dates.</b>
          <span className="sua">Cuando alguien te apruebe y tú a esa persona, aparecerá aquí.</span>
          <button type="button" className="btn2">
            Ir a La Orla
          </button>
        </div>
        <div className="card rellena" aria-busy="true">
          <span className="esq" style={{ width: '40%' }} />
          <span className="esq" />
          <span className="esq" style={{ width: '70%' }} />
        </div>
      </section>

      <ConfirmModal
        open={confirmOpen}
        message="Esto no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
