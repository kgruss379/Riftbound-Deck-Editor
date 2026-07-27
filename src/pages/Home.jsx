import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/editor?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <Container className="py-5 text-light">
      <Row className="justify-content-center text-center mb-5">
        <Col lg={9}>
          <div className="game-logo-container mb-3">
            <h1 className="display-3 fw-bold text-glow text-gold tracking-wide">RIFTBOUND</h1>
            <h2 className="text-cyan tracking-wider fs-4 text-uppercase">League of Legends Trading Card Game</h2>
          </div>
          <p className="lead text-secondary-glow mb-4">
            Build and optimize your decks for the premier physical tabletop card game set in the Runeterra universe. Draft your legend, select your runes, and prepare your battlefields.
          </p>

          {/* Quick Card Finder Search Bar */}
          <Form onSubmit={handleSearchSubmit} className="mb-5 mx-auto" style={{ maxWidth: '600px' }}>
            <InputGroup className="input-group-glass border-gold-subtle rounded-pill overflow-hidden p-1 shadow-lg">
              <Form.Control
                type="text"
                placeholder="Search for cards... e.g. Blazing Scorcher, Fury Rune, Kai'Sa"
                className="bg-transparent border-0 text-white ps-4 py-3 fs-5"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              <Button 
                type="submit" 
                variant="gold" 
                className="px-4 py-3 fw-bold text-uppercase rounded-pill"
              >
                🔍 Search
              </Button>
            </InputGroup>
          </Form>

          <div className="d-flex justify-content-center gap-3">
            <Button 
              as={Link} 
              to="/editor" 
              variant="cyan" 
              size="lg" 
              className="px-4 py-3 fw-bold text-uppercase border-glow"
            >
              Launch Deck Editor
            </Button>
            <a 
              href="https://github.com/kgruss379/Riftbound-Deck-Editor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-gold btn-lg px-4 py-3 fw-bold text-uppercase"
            >
              View GitHub Repo
            </a>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="h-100 card-glass border-gold-subtle">
            <Card.Body className="d-flex flex-column p-4">
              <div className="card-icon text-gold mb-3">
                <i className="bi bi-shield-shaded fs-1">🛡️</i>
              </div>
              <Card.Title className="text-gold fw-bold fs-4">Official Deck Rules</Card.Title>
              <div className="text-muted flex-grow-1">
                Construct tournament-legal decks matching all official guidelines:
                <ul className="mt-2 text-start ps-3 small">
                  <li><strong>Main Deck:</strong> Exactly 40 cards (Units, Spells, Gear).</li>
                  <li><strong>Rune Deck:</strong> Exactly 12 Rune cards.</li>
                  <li><strong>Legend:</strong> Exactly 1 Legend card.</li>
                  <li><strong>Battlefields:</strong> Exactly 3 Battlefield cards.</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 card-glass border-cyan-subtle">
            <Card.Body className="d-flex flex-column p-4">
              <div className="card-icon text-cyan mb-3">
                <i className="bi bi-droplet-fill fs-1">💧</i>
              </div>
              <Card.Title className="text-cyan fw-bold fs-4">Domain Identity</Card.Title>
              <Card.Text className="text-muted flex-grow-1 small">
                Your Legend dictates your Domain colors: 
                <strong> Fury</strong> (Red), <strong>Calm</strong> (Blue), <strong>Mind</strong> (Purple), <strong>Body</strong> (Orange), <strong>Chaos</strong> (Magenta), or <strong>Order</strong> (Gold). 
                Rules ensure your deck only contains cards matching your Legend's identity, plus <strong>Colorless</strong> neutrals.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 card-glass border-purple-subtle">
            <Card.Body className="d-flex flex-column p-4">
              <div className="card-icon text-purple mb-3">
                <i className="bi bi-lightning-fill fs-1">⚡</i>
              </div>
              <Card.Title className="text-purple fw-bold fs-4">Offline Local Database</Card.Title>
              <Card.Text className="text-muted flex-grow-1 small">
                This app runs entirely in your browser with 100% offline support. The complete card collection of Sets 1 to 3 (including artwork, abilities, energy costs, and statistics) is loaded locally.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5 text-center">
        <Col>
          <div className="p-4 rounded card-glass border-secondary-subtle">
            <h3 className="fs-5 text-light text-uppercase mb-3">Getting Started Guide</h3>
            <p className="text-muted mb-0 small">
              Use the card finder search bar above to look up specific cards, or click the **Launch Deck Editor** button to build your strategy. You can select your Legend, construct your main and rune decks, review real-time validation checks, and export your list!
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
