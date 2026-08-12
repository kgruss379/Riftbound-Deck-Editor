import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import Login from './pages/Login.jsx';

export default function App() {
  const location = useLocation();

  // Authentication states backed by localStorage for session persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('riftbound_auth') === 'true';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('riftbound_username') || '';
  });

  const handleLogin = (user) => {
    localStorage.setItem('riftbound_auth', 'true');
    localStorage.setItem('riftbound_username', user);
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('riftbound_auth');
    localStorage.removeItem('riftbound_username');
    setIsAuthenticated(false);
    setUsername('');
  };

  // If not authenticated, render the login page in isolation (no navbar or footer)
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light font-sans animate-fade-in">
      {/* Navigation Header */}
      <Navbar bg="black" variant="dark" expand="lg" className="border-bottom border-secondary-subtle py-3 header-glass sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold tracking-wider text-glow text-gold text-uppercase d-flex align-items-center gap-2">
            🛡️ Riftbound Editor
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto fw-bold text-uppercase align-items-lg-center">
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
              <Nav.Link 
                as={Link} 
                to="/community" 
                active={location.pathname === '/community'} 
                className="nav-link-custom mx-2"
              >
                Community Decks
              </Nav.Link>

              {/* User Session Info & Logout Control */}
              <div className="d-flex align-items-center gap-2 ms-lg-3 mt-3 mt-lg-0 border-lg-start ps-lg-3 border-secondary-subtle">
                <Badge bg="dark" className="border border-gold text-gold py-2 px-3 text-xs d-flex align-items-center gap-1">
                  👤 {username === 'Guest' ? 'Guest Mode' : username}
                </Badge>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={handleLogout}
                  className="fw-bold py-1 px-3 text-xs"
                >
                  🚪 Exit
                </Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        <Outlet context={{ username }} />
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
