import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Container className="py-5 text-light">
      <Row className="justify-content-center text-center mb-5">
        <Col lg={9}>
          <div className="game-logo-container mb-3">
            <h1 className="display-3 fw-bold text-glow text-gold tracking-wide">RIFTBOUND</h1>
            <h2 className="text-cyan tracking-wider fs-4 text-uppercase">League of Legends Trading Card Game</h2>
          </div>
          <p className="lead text-secondary-glow mb-4">
            Build and optimize your decks for the premier physical tabletop card game set in the Runeterra universe. Draft your champions, select your domains, and prepare your battlefields.
          </p>
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
              <Card.Text className="text-muted flex-grow-1">
                Construct tournament-legal decks matching all official guidelines:
                <ul className="mt-2 text-start ps-3">
                  <li><strong>Main Deck:</strong> Exactly 40 cards.</li>
                  <li><strong>Rune Deck:</strong> Exactly 12 cards.</li>
                  <li><strong>Legend & Champion:</strong> Exactly 1 of each.</li>
                  <li><strong>Battlefields:</strong> Exactly 3 cards.</li>
                </ul>
              </Card.Text>
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
              <Card.Text className="text-muted flex-grow-1">
                Your Legend dictates your Domain colors (Fire, Water, Earth, Air). Filters ensure you only add cards aligned with your chosen domains, matching the official construction constraints.
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
              <Card.Title className="text-purple fw-bold fs-4">Pure Client-Side</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                No servers, no databases, no Next.js overhead. This application runs entirely in your browser, enabling fast operations, offline capabilities, and easy deployment to GitHub Pages.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5 text-center">
        <Col>
          <div className="p-4 rounded card-glass border-secondary-subtle">
            <h3 className="fs-5 text-light text-uppercase mb-3">Getting Started Guide</h3>
            <p className="text-muted mb-0">
              Navigate to the <strong>Deck Editor</strong> using the button above to begin crafting your strategy. You can add units, spells, gear, and runes, select your Legend and Champion, and export your list!
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
