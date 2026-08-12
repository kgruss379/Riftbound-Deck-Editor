import React, { useState } from 'react';
import { Card, Button, Form, Alert, Container, Row, Col } from 'react-bootstrap';

export default function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Username cannot be empty.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    // Retrieve existing mock users from localStorage
    const storedUsers = localStorage.getItem('riftbound_users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};

    if (isSignUp) {
      // Sign Up Flow
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (users[trimmedUsername.toLowerCase()]) {
        setError('Username is already taken.');
        return;
      }

      // Register new user locally
      users[trimmedUsername.toLowerCase()] = {
        username: trimmedUsername,
        password: password
      };
      localStorage.setItem('riftbound_users', JSON.stringify(users));
      
      setSuccess('Account created successfully!');
      // Instantly log in after registration
      setTimeout(() => {
        onLogin(trimmedUsername);
      }, 1000);

    } else {
      // Sign In Flow
      const matchedUser = users[trimmedUsername.toLowerCase()];
      if (!matchedUser || matchedUser.password !== password) {
        setError('Invalid username or password. Please try again or sign up.');
        return;
      }

      onLogin(matchedUser.username);
    }
  };

  const handleGuestLogin = () => {
    onLogin('Guest');
  };

  return (
    <div className="login-bg-wrapper d-flex align-items-center min-vh-100 py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="card-glass border-gold-subtle p-4 shadow-lg text-center auth-card animate-fade-in">
              <Card.Body className="p-2">
                {/* Branded Header */}
                <div className="auth-logo-container mb-4">
                  <div className="auth-shield mb-2">🛡️</div>
                  <h1 className="fs-3 fw-bold text-glow text-gold tracking-wide m-0">RIFTBOUND</h1>
                  <span className="text-cyan text-xs font-semibold tracking-wider text-uppercase">
                    TCG Deck Builder
                  </span>
                </div>

                <p className="text-secondary-glow small mb-4">
                  {isSignUp 
                    ? 'Create a local account to customize and save your card decks.'
                    : 'Sign in to customize your deck profiles, or browse immediately as a guest.'
                  }
                </p>

                {error && (
                  <Alert variant="danger" className="text-xs py-2 border-danger-subtle bg-danger-subtle text-danger mb-3">
                    ⚠️ {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="text-xs py-2 border-success-subtle bg-success-subtle text-success mb-3 animate-pulse">
                    ✨ {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} className="text-start">
                  <Form.Group className="mb-3" controlId="loginUsername">
                    <Form.Label className="text-gold text-xs font-semibold uppercase mb-1">
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter username"
                      className="bg-transparent border-secondary text-white ps-3 py-2 fs-6 login-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="loginPassword">
                    <Form.Label className="text-gold text-xs font-semibold uppercase mb-1">
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder={isSignUp ? "Create a password" : "Enter password"}
                      className="bg-transparent border-secondary text-white ps-3 py-2 fs-6 login-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ outline: 'none', boxShadow: 'none' }}
                    />
                  </Form.Group>

                  {isSignUp && (
                    <Form.Group className="mb-4" controlId="loginConfirmPassword">
                      <Form.Label className="text-gold text-xs font-semibold uppercase mb-1">
                        Confirm Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Re-enter password"
                        className="bg-transparent border-secondary text-white ps-3 py-2 fs-6 login-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ outline: 'none', boxShadow: 'none' }}
                      />
                    </Form.Group>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-100 py-2 fw-bold text-uppercase rounded mb-3 border-glow-btn mt-2"
                  >
                    {isSignUp ? '📝 Register & Login' : '🔐 Sign In'}
                  </Button>
                </Form>

                {/* Auth Mode Toggle Link */}
                <div className="text-xs text-secondary-glow mb-3">
                  {isSignUp ? (
                    <span>
                      Already have an account?{' '}
                      <span className="text-gold cursor-pointer fw-bold hover-underline" onClick={toggleAuthMode} style={{ cursor: 'pointer' }}>
                        Sign In
                      </span>
                    </span>
                  ) : (
                    <span>
                      Don't have an account?{' '}
                      <span className="text-gold cursor-pointer fw-bold hover-underline" onClick={toggleAuthMode} style={{ cursor: 'pointer' }}>
                        Sign Up
                      </span>
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center my-3 text-muted text-xs">
                  <hr className="flex-grow-1 border-secondary" style={{ opacity: 0.15 }} />
                  <span className="mx-2">OR</span>
                  <hr className="flex-grow-1 border-secondary" style={{ opacity: 0.15 }} />
                </div>

                <Button
                  variant="outline-cyan"
                  className="w-100 py-2 fw-bold text-uppercase rounded"
                  onClick={handleGuestLogin}
                >
                  👤 Login as Guest
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
