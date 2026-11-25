import { Link, NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="navbar">
      <Link className="brand" to="/">
        Studate
      </Link>

      {/* NavLink le pone la clase "active" al enlace de la página en la que estoy */}
      <nav>
        <NavLink to="/">Inicio</NavLink>
      </nav>
    </header>
  );
}
