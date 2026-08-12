import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, InputGroup, Alert } from 'react-bootstrap';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CARDS_DATABASE } from '../data/cards.js';

const SEEDED_DECKS = [
  {
    id: 'deck-seed-1',
    title: "Kai'Sa Void Evolution",
    description: 'Focuses on rapid Rune generation to trigger reaction spells and overwhelm with Void units.',
    author: 'Sarah',
    likes: ['Alex', 'Gamer99', 'RiftMaster'],
    comments: [
      {
        id: 'c-1',
        author: 'Alex',
        text: 'Solid build! Have you considered swapping out 1 Gear for another spell?',
        timestamp: '2026-08-10T14:32:00.000Z'
      },
      {
        id: 'c-2',
        author: 'Sarah',
        text: 'That is actually what I changed in v2! Check the version log.',
        timestamp: '2026-08-10T15:05:00.000Z'
      }
    ],
    versions: [
      {
        versionName: 'v2 - Spell Heavy (Current)',
        changeLog: 'Substituted 2 Gear cards for 2 damage reaction Spells to improve tempo.',
        timestamp: '2026-08-10T15:00:00.000Z',
        deck: {
          legendId: 'ogn-247',
          battlefieldIds: ['ogn-1653', 'ogn-1654', 'ogn-1655'],
          runeDeck: [{ cardId: 'ogn-1507', count: 12 }],
          mainDeck: [
            { cardId: 'ogn-2327', count: 3 },
            { cardId: 'ogn-2328', count: 3 },
            { cardId: 'ogn-2329', count: 3 },
            { cardId: 'ogn-2330', count: 3 }
          ]
        }
      },
      {
        versionName: 'v1 - Initial Concept',
        changeLog: 'First tournament prototype.',
        timestamp: '2026-08-08T10:00:00.000Z',
        deck: {
          legendId: 'ogn-247',
          battlefieldIds: ['ogn-1653', 'ogn-1654', 'ogn-1655'],
          runeDeck: [{ cardId: 'ogn-1507', count: 12 }],
          mainDeck: [
            { cardId: 'ogn-2327', count: 3 },
            { cardId: 'ogn-2328', count: 3 }
          ]
        }
      }
    ]
  },
  {
    id: 'deck-seed-2',
    title: 'Jinx Chaos Rocket Burst',
    description: 'Empty your hand fast to draw free cards every turn with Jinx Loose Cannon.',
    author: 'Alex',
    likes: ['Sarah'],
    comments: [
      {
        id: 'c-3',
        author: 'Gamer99',
        text: 'Jinx is super fun to play. Love the aggressive curve.',
        timestamp: '2026-08-11T09:12:00.000Z'
      }
    ],
    versions: [
      {
        versionName: 'v1 - Main Build',
        changeLog: 'Standard 40-card low energy curve.',
        timestamp: '2026-08-09T18:20:00.000Z',
        deck: {
          legendId: 'ogn-251',
          battlefieldIds: ['ogn-1656', 'ogn-1657', 'ogn-1658'],
          runeDeck: [{ cardId: 'ogn-1508', count: 12 }],
          mainDeck: [
            { cardId: 'ogn-2331', count: 3 },
            { cardId: 'ogn-2332', count: 3 }
          ]
        }
      }
    ]
  },
  {
    id: 'deck-seed-3',
    title: 'Yasuo Wind Control',
    description: 'Control battlefields by repositioning friendly units out of danger.',
    author: 'Gamer99',
    likes: ['Sarah', 'Alex', 'Keegan'],
    comments: [],
    versions: [
      {
        versionName: 'v1 - Base Control',
        changeLog: 'Calm and Chaos defensive positioning list.',
        timestamp: '2026-08-11T11:00:00.000Z',
        deck: {
          legendId: 'ogn-259',
          battlefieldIds: ['ogn-1653', 'ogn-1656', 'ogn-1657'],
          runeDeck: [{ cardId: 'ogn-1509', count: 12 }],
          mainDeck: [
            { cardId: 'ogn-2333', count: 3 }
          ]
        }
      }
    ]
  }
];

export default function CommunityDecks() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const currentUsername = outletContext?.username || localStorage.getItem('riftbound_username') || 'Guest';

  const [decks, setDecks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLegendFilter, setSelectedLegendFilter] = useState('ALL');

  // Modal detail states
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [commentText, setCommentText] = useState('');

  // Owner edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Load and seed community decks
  useEffect(() => {
    const raw = localStorage.getItem('riftbound_community_decks');
    if (!raw) {
      localStorage.setItem('riftbound_community_decks', JSON.stringify(SEEDED_DECKS));
      setDecks(SEEDED_DECKS);
    } else {
      try {
        setDecks(JSON.parse(raw));
      } catch (e) {
        setDecks(SEEDED_DECKS);
      }
    }
  }, []);

  const saveDecksToStorage = (updatedDecks) => {
    setDecks(updatedDecks);
    localStorage.setItem('riftbound_community_decks', JSON.stringify(updatedDecks));
    // If detail modal is open, keep selectedDeck in sync
    if (selectedDeck) {
      const refreshed = updatedDecks.find(d => d.id === selectedDeck.id);
      if (refreshed) {
        setSelectedDeck(refreshed);
      }
    }
  };

  // Helper to find Legend details
  const getLegendCard = (legendId) => {
    return CARDS_DATABASE.legends.find(l => l.id === legendId);
  };

  // Helper to map card IDs back to full card objects for display
  const resolveCardObject = (cardId, category = 'mainDeck') => {
    let pool = CARDS_DATABASE.mainDeck;
    if (category === 'legends') pool = CARDS_DATABASE.legends;
    if (category === 'runes') pool = CARDS_DATABASE.runes;
    if (category === 'battlefields') pool = CARDS_DATABASE.battlefields;
    
    return pool.find(c => c.id === cardId) || { id: cardId, name: 'Unknown Card', type: 'Unit', domains: ['Colorless'] };
  };

  // Toggle Like (Thumbs Up)
  const handleToggleLike = (deckId) => {
    const updated = decks.map(d => {
      if (d.id === deckId) {
        const hasLiked = d.likes.includes(currentUsername);
        const newLikes = hasLiked
          ? d.likes.filter(u => u !== currentUsername)
          : [...d.likes, currentUsername];
        return { ...d, likes: newLikes };
      }
      return d;
    });
    saveDecksToStorage(updated);
  };

  // Post Comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedDeck) return;

    const newComment = {
      id: 'comment-' + Date.now(),
      author: currentUsername,
      text: commentText.trim(),
      timestamp: new Date().toISOString()
    };

    const updated = decks.map(d => {
      if (d.id === selectedDeck.id) {
        return { ...d, comments: [...d.comments, newComment] };
      }
      return d;
    });

    saveDecksToStorage(updated);
    setCommentText('');
  };

  // Owner Delete Deck
  const handleDeleteDeck = (deckId) => {
    if (window.confirm('Are you sure you want to delete this deck post? This action cannot be undone.')) {
      const updated = decks.filter(d => d.id !== deckId);
      saveDecksToStorage(updated);
      setSelectedDeck(null);
      setEditModalOpen(false);
    }
  };

  // Owner Save Edit
  const handleSaveDeckEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !selectedDeck) return;

    const updated = decks.map(d => {
      if (d.id === selectedDeck.id) {
        return {
          ...d,
          title: editTitle.trim(),
          description: editDescription.trim()
        };
      }
      return d;
    });

    saveDecksToStorage(updated);
    setEditModalOpen(false);
  };

  // Load selected version into the Deck Editor
  const handleImportToEditor = (versionObj) => {
    if (!versionObj || !versionObj.deck) return;
    
    // Store selected community version in localStorage for Editor to pick up
    localStorage.setItem('riftbound_import_deck', JSON.stringify({
      title: selectedDeck.title,
      versionName: versionObj.versionName,
      deck: versionObj.deck
    }));

    navigate('/editor?import=community');
  };

  // Filtered decks list
  const filteredDecks = decks.filter(deck => {
    const latestVer = deck.versions && deck.versions[0];
    const legendCard = latestVer ? getLegendCard(latestVer.deck.legendId) : null;

    const queryMatch = searchQuery.trim() === '' ||
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (legendCard && legendCard.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const legendMatch = selectedLegendFilter === 'ALL' || (legendCard && legendCard.name.toLowerCase().includes(selectedLegendFilter.toLowerCase()));

    return queryMatch && legendMatch;
  });

  return (
    <Container className="py-5 text-light">
      {/* Header Banner */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-glow text-gold tracking-wide mb-2">COMMUNITY DECKS</h1>
        <p className="lead text-secondary-glow mx-auto mb-4" style={{ maxWidth: '700px' }}>
          Explore, playtest, and rate community-crafted decks. Inspect complete version histories, leave feedback, or copy lists straight into your deck editor.
        </p>
        
        {/* Search & Filter Bar */}
        <Row className="g-3 justify-content-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Col md={8}>
            <InputGroup className="input-group-glass border-gold-subtle rounded-pill overflow-hidden shadow-sm">
              <Form.Control
                type="text"
                placeholder="Search decks by title, author, or champion..."
                className="bg-transparent border-0 text-white ps-4 py-2 fs-6"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ outline: 'none', boxShadow: 'none' }}
              />
              {searchQuery && (
                <Button variant="link" className="text-muted pe-3 text-decoration-none" onClick={() => setSearchQuery('')}>
                  ✕
                </Button>
              )}
            </InputGroup>
          </Col>
          <Col md={4}>
            <Form.Select 
              className="bg-dark text-gold border-gold-subtle rounded-pill py-2 text-xs font-bold"
              value={selectedLegendFilter}
              onChange={(e) => setSelectedLegendFilter(e.target.value)}
            >
              <option value="ALL">All Champions</option>
              <option value="Kai'Sa">Kai'Sa</option>
              <option value="Jinx">Jinx</option>
              <option value="Yasuo">Yasuo</option>
              <option value="Darius">Darius</option>
              <option value="Ahri">Ahri</option>
              <option value="Volibear">Volibear</option>
              <option value="Lee Sin">Lee Sin</option>
              <option value="Leona">Leona</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <p className="fs-5">No community decks match your search query.</p>
          <Button variant="outline-gold" size="sm" onClick={() => { setSearchQuery(''); setSelectedLegendFilter('ALL'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <Row className="row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredDecks.map(deck => {
            const currentVer = deck.versions[0];
            const legendCard = currentVer ? getLegendCard(currentVer.deck.legendId) : null;
            const isLiked = deck.likes.includes(currentUsername);
            const isOwner = currentUsername && deck.author.toLowerCase() === currentUsername.toLowerCase();

            return (
              <Col key={deck.id}>
                <Card className="card-glass border-secondary-subtle h-100 overflow-hidden text-start hover-zoom-card d-flex flex-column justify-content-between">
                  <div>
                    {/* Header Image / Legend Banner */}
                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden', backgroundColor: '#090d16' }}>
                      {legendCard && legendCard.image ? (
                        <img 
                          src={legendCard.image} 
                          alt={legendCard.name}
                          className="w-100 h-100 object-fit-cover card-zoom-img"
                          style={{ objectPosition: 'center 20%' }}
                        />
                      ) : (
                        <div className="d-flex h-100 align-items-center justify-content-center text-muted fs-4 fw-bold">
                          {deck.title}
                        </div>
                      )}
                      
                      <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(5,6,8,0.95), transparent)', zIndex: 2 }}>
                        <Badge bg="gold" className="text-dark font-bold text-xxs mb-1 uppercase">
                          {legendCard ? legendCard.name : 'Custom Deck'}
                        </Badge>
                        <h3 className="fs-5 fw-bold text-white mb-0 text-truncate">{deck.title}</h3>
                      </div>

                      {/* Top Badges */}
                      <div className="position-absolute top-0 end-0 m-2 d-flex gap-1" style={{ zIndex: 3 }}>
                        <Badge bg="dark" className="border border-gold text-gold text-xxs">
                          {deck.versions.length} {deck.versions.length === 1 ? 'Version' : 'Versions'}
                        </Badge>
                        {isOwner && (
                          <Badge bg="cyan" className="text-dark font-bold text-xxs">
                            YOUR DECK
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-xs text-muted">
                          By <strong className="text-light">{deck.author}</strong>
                        </span>
                        <span className="text-xxs text-muted">
                          {currentVer ? new Date(currentVer.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <Card.Text className="text-secondary-glow text-xs mb-3 text-line-clamp-2" style={{ minHeight: '36px' }}>
                        {deck.description || 'No description provided.'}
                      </Card.Text>
                    </Card.Body>
                  </div>

                  {/* Card Footer Actions */}
                  <Card.Footer className="bg-transparent border-top border-secondary-subtle p-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      {/* Thumbs up / Like Button */}
                      <Button
                        variant={isLiked ? "gold" : "outline-secondary"}
                        size="sm"
                        className="py-1 px-2 text-xs d-flex align-items-center gap-1"
                        onClick={() => handleToggleLike(deck.id)}
                      >
                        👍 {deck.likes.length}
                      </Button>

                      {/* Comments Indicator */}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="py-1 px-2 text-xs d-flex align-items-center gap-1"
                        onClick={() => { setSelectedDeck(deck); setSelectedVersionIdx(0); }}
                      >
                        💬 {deck.comments.length}
                      </Button>
                    </div>

                    <Button
                      variant="outline-cyan"
                      size="sm"
                      className="py-1 px-3 text-xs fw-bold text-uppercase"
                      onClick={() => { setSelectedDeck(deck); setSelectedVersionIdx(0); }}
                    >
                      View Deck
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* DECK DETAIL & VERSIONING OVERLAY MODAL */}
      {selectedDeck && (
        <Modal 
          show={true} 
          onHide={() => setSelectedDeck(null)} 
          size="lg" 
          centered 
          contentClassName="bg-dark text-light border-gold-subtle shadow-lg"
        >
          <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary-subtle">
            <div>
              <div className="d-flex align-items-center gap-2">
                <Modal.Title className="text-gold fw-bold fs-4 m-0">{selectedDeck.title}</Modal.Title>
                <Badge bg="dark" className="border border-gold text-gold text-xs">
                  By {selectedDeck.author}
                </Badge>
              </div>
              <p className="text-secondary-glow text-xs m-0 mt-1">{selectedDeck.description}</p>
            </div>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Version Switcher Bar */}
            <div className="p-3 mb-4 rounded bg-darker border border-secondary-subtle d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="text-gold text-xs font-bold uppercase me-1">Select Version:</span>
                <Form.Select 
                  size="sm"
                  className="bg-dark text-white border-secondary text-xs"
                  value={selectedVersionIdx}
                  onChange={(e) => setSelectedVersionIdx(Number(e.target.value))}
                  style={{ width: 'auto', minWidth: '200px' }}
                >
                  {selectedDeck.versions.map((ver, idx) => (
                    <option key={idx} value={idx}>
                      {ver.versionName} ({new Date(ver.timestamp).toLocaleDateString()})
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="d-flex gap-2">
                <Button 
                  variant="gold" 
                  size="sm" 
                  className="fw-bold text-uppercase text-xs px-3"
                  onClick={() => handleImportToEditor(selectedDeck.versions[selectedVersionIdx])}
                >
                  📥 Load into Editor
                </Button>

                {/* Owner controls */}
                {currentUsername && selectedDeck.author.toLowerCase() === currentUsername.toLowerCase() && (
                  <>
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        setEditTitle(selectedDeck.title);
                        setEditDescription(selectedDeck.description || '');
                        setEditModalOpen(true);
                      }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleDeleteDeck(selectedDeck.id)}
                    >
                      🗑️ Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Selected Version Changelog */}
            {selectedDeck.versions[selectedVersionIdx] && (
              <div className="mb-4 text-xs bg-dark p-3 rounded border border-secondary">
                <strong className="text-cyan">Version Notes: </strong>
                <span className="text-secondary-glow">{selectedDeck.versions[selectedVersionIdx].changeLog || 'No release notes.'}</span>
              </div>
            )}

            {/* Cards List Breakdown for Selected Version */}
            {selectedDeck.versions[selectedVersionIdx] && (
              <div className="mb-4">
                <h4 className="fs-6 font-bold text-gold uppercase mb-3">Deck Breakdown</h4>
                
                <Row className="g-3">
                  {/* Legend Slot */}
                  <Col md={4}>
                    <div className="p-2 rounded bg-darker border border-secondary text-center">
                      <span className="text-xxs text-muted uppercase font-bold d-block mb-1">👑 Legend</span>
                      {(() => {
                        const leg = getLegendCard(selectedDeck.versions[selectedVersionIdx].deck.legendId);
                        return leg ? (
                          <div>
                            <span className="fw-bold text-white text-xs d-block">{leg.name}</span>
                            <span className="text-xxs text-gold">{leg.domains?.join(', ')}</span>
                          </div>
                        ) : <span className="text-xs text-muted">None</span>;
                      })()}
                    </div>
                  </Col>

                  {/* Battlefields */}
                  <Col md={8}>
                    <div className="p-2 rounded bg-darker border border-secondary">
                      <span className="text-xxs text-muted uppercase font-bold d-block mb-1">🏔️ Battlefields (3)</span>
                      <div className="d-flex gap-2 flex-wrap text-xs">
                        {selectedDeck.versions[selectedVersionIdx].deck.battlefieldIds.map(bId => {
                          const bf = resolveCardObject(bId, 'battlefields');
                          return (
                            <Badge key={bId} bg="dark" className="border border-secondary text-secondary-glow">
                              {bf.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Main Deck & Runes Overview */}
                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <div className="p-3 rounded bg-darker border border-secondary">
                      <span className="text-xs text-gold font-bold uppercase d-block mb-2">💎 Rune Deck</span>
                      <ul className="list-unstyled text-xs m-0">
                        {selectedDeck.versions[selectedVersionIdx].deck.runeDeck.map((rItem, idx) => {
                          const rCard = resolveCardObject(rItem.cardId, 'runes');
                          return (
                            <li key={idx} className="d-flex justify-content-between py-1 border-bottom border-secondary-subtle">
                              <span className="text-white">{rCard.name}</span>
                              <span className="text-gold font-bold">x{rItem.count}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-3 rounded bg-darker border border-secondary" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <span className="text-xs text-cyan font-bold uppercase d-block mb-2">⚔️ Main Deck Cards</span>
                      <ul className="list-unstyled text-xs m-0">
                        {selectedDeck.versions[selectedVersionIdx].deck.mainDeck.map((mItem, idx) => {
                          const mCard = resolveCardObject(mItem.cardId, 'mainDeck');
                          return (
                            <li key={idx} className="d-flex justify-content-between py-1 border-bottom border-secondary-subtle">
                              <span className="text-white">{mCard.name}</span>
                              <span className="text-cyan font-bold">x{mItem.count}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            <hr className="border-secondary my-4" />

            {/* COMMENTS & LIKES SECTION */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fs-6 font-bold text-gold uppercase m-0">
                  Discussion ({selectedDeck.comments.length})
                </h4>

                <Button
                  variant={selectedDeck.likes.includes(currentUsername) ? "gold" : "outline-secondary"}
                  size="sm"
                  className="py-1 px-3 text-xs d-flex align-items-center gap-2"
                  onClick={() => handleToggleLike(selectedDeck.id)}
                >
                  👍 {selectedDeck.likes.includes(currentUsername) ? 'Liked' : 'Thumbs Up'} ({selectedDeck.likes.length})
                </Button>
              </div>

              {/* Add Comment Form */}
              <Form onSubmit={handleAddComment} className="mb-4">
                <InputGroup className="input-group-glass rounded">
                  <Form.Control
                    type="text"
                    placeholder={`Comment as ${currentUsername}...`}
                    className="bg-dark text-white border-secondary text-xs py-2 ps-3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button type="submit" variant="gold" size="sm" className="px-3 text-xs font-bold uppercase">
                    Post
                  </Button>
                </InputGroup>
              </Form>

              {/* Comments List */}
              {selectedDeck.comments.length === 0 ? (
                <div className="text-center py-3 text-muted text-xs italic">
                  No comments yet. Be the first to leave feedback!
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {selectedDeck.comments.map(c => (
                    <div key={c.id} className="p-3 rounded bg-darker border border-secondary text-xs">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-cyan">{c.author}</strong>
                        <span className="text-xxs text-muted">{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-secondary-glow m-0">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* OWNER EDIT TITLE & DESCRIPTION MODAL */}
      <Modal 
        show={editModalOpen} 
        onHide={() => setEditModalOpen(false)} 
        centered 
        contentClassName="bg-dark text-light border-warning shadow-lg"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary-subtle">
          <Modal.Title className="text-warning fs-5 font-bold uppercase m-0">✏️ Edit Deck Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSaveDeckEdit}>
            <Form.Group className="mb-3" controlId="editTitleInput">
              <Form.Label className="text-gold text-xs font-bold uppercase">Deck Title</Form.Label>
              <Form.Control
                type="text"
                className="bg-darker border-secondary text-white text-xs py-2"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="editDescInput">
              <Form.Label className="text-gold text-xs font-bold uppercase">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="bg-darker border-secondary text-white text-xs p-2"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="warning" size="sm" type="submit" className="fw-bold uppercase px-3">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
