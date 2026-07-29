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
                <strong> Fury</strong> (Red), <strong>Mind</strong> (Blue), <strong>Chaos</strong> (Purple), <strong>Order</strong> (Yellow), <strong>Calm</strong> (Green), or <strong>Body</strong> (Orange). 
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

      {/* Featured Legends Quick Start Portal */}
      <div className="mt-5 pt-4 text-center">
        <h3 className="fs-4 text-glow text-gold text-uppercase mb-4">Choose a Featured Legend</h3>
        <Row className="row-cols-1 row-cols-md-3 g-4 justify-content-center">
          {[
            {
              id: 'ogn-247',
              name: "Kai'Sa",
              title: 'Daughter of the Void',
              domains: ['Fury', 'Mind'],
              image: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/a576472c7bb00f475882ac814e1d8f9be233b402-744x1040.png'
            },
            {
              id: 'ogn-251',
              name: 'Jinx',
              title: 'Loose Cannon',
              domains: ['Fury', 'Chaos'],
              image: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/f57c14381b126e9f5a7b5bc4913151cb24c14fc3-744x1039.png'
            },
            {
              id: 'ogn-259',
              name: 'Yasuo',
              title: 'Unforgiven',
              domains: ['Calm', 'Chaos'],
              image: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/68e4d3230b785738ae9d86f780f7f5607ef11807-744x1040.png'
            }
          ].map(leg => (
            <Col key={leg.id}>
              <Card className="card-glass border-secondary-subtle h-100 overflow-hidden text-start hover-zoom-card">
                <div style={{ position: 'relative', height: '260px', overflow: 'hidden', backgroundColor: '#090d16' }}>
                  <img 
                    src={leg.image} 
                    alt={leg.title} 
                    className="w-100 h-100 object-fit-cover card-zoom-img"
                    style={{ transition: 'transform 0.4s ease' }}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(5,6,8,0.9), transparent)', zIndex: 2 }}>
                    <h4 className="fs-5 fw-bold text-white mb-0">{leg.name}</h4>
                    <span className="text-muted text-xs font-semibold">{leg.title}</span>
                  </div>
                  <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 3 }}>
                    {leg.domains.map(d => (
                      <span key={d} className={`badge bg-domain-${d.toLowerCase()} text-dark me-1`}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <Card.Body className="p-3 d-flex flex-column justify-content-between" style={{ backgroundColor: 'rgba(10, 14, 22, 0.4)' }}>
                  <Button 
                    as={Link} 
                    to={`/editor?legend=${leg.id}`} 
                    variant="outline-cyan" 
                    size="sm" 
                    className="w-100 fw-bold text-uppercase mt-2"
                  >
                    Build with {leg.name}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );
}
