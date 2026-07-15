import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function App() {
  const location = useLocation();

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light font-sans">
      {/* Navigation Header */}
      <Navbar bg="black" variant="dark" expand="lg" className="border-bottom border-secondary-subtle py-3 header-glass sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold tracking-wider text-glow text-gold text-uppercase d-flex align-items-center gap-2">
            🛡️ Riftbound Editor
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto fw-bold text-uppercase">
              <Nav.Link 
                as={Link} 
                to="/" 
                active={location.pathname === '/'} 
                className="nav-link-custom mx-2"
              >
                Home
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/editor" 
                active={location.pathname === '/editor'} 
                className="nav-link-custom mx-2"
              >
                Deck Editor
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black py-4 border-top border-secondary-subtle text-center text-muted small">
        <Container>
          <p className="mb-1">Riftbound Deck Editor — Built with React, React Router & React Bootstrap.</p>
          <p className="mb-0">
            This is a fan project and is not affiliated with Riot Games or UVS Games. 
            All card art and League of Legends lore are property of their respective owners.
          </p>
        </Container>
      </footer>
    </div>
  );
}
