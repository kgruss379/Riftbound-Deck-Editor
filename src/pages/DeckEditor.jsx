import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Tab, Nav, Alert, Modal } from 'react-bootstrap';
import { MOCK_CARDS } from '../data/cards';

export default function DeckEditor() {
  // State
  const [selectedLegend, setSelectedLegend] = useState(null);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [mainDeck, setMainDeck] = useState([]); // Array of { card, count }
  const [runeDeck, setRuneDeck] = useState([]); // Array of { card, count }
  const [selectedBattlefields, setSelectedBattlefields] = useState([]); // Array of cards
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [activePoolTab, setActivePoolTab] = useState('legends');
  
  // Modal State for Exports
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportText, setExportText] = useState('');

  // Derived state: active domains allowed based on selected legend
  const allowedDomains = useMemo(() => {
    if (!selectedLegend) return ['Fire', 'Water', 'Earth', 'Air']; // All before legend selection
    return selectedLegend.domains;
  }, [selectedLegend]);

  // Main Deck totals
  const mainDeckCount = useMemo(() => {
    return mainDeck.reduce((acc, item) => acc + item.count, 0);
  }, [mainDeck]);

  // Rune Deck totals
  const runeDeckCount = useMemo(() => {
    return runeDeck.reduce((acc, item) => acc + item.count, 0);
  }, [runeDeck]);

  // Check card domain legality
  const isCardDomainLegal = (card) => {
    if (!selectedLegend) return true; // Show warning elsewhere, don't block adding yet
    return card.domains.some(domain => allowedDomains.includes(domain));
  };

  // Helper to add card to main deck
  const addToMainDeck = (card) => {
    // 1. Domain legality check
    if (selectedLegend && !isCardDomainLegal(card)) {
      alert(`Cannot add ${card.name}. It does not match your Legend's domain identity (${allowedDomains.join('/')}).`);
      return;
    }
    // 2. Count limit check (max 3 of any card)
    const existing = mainDeck.find(item => item.card.id === card.id);
    if (existing) {
      if (existing.count >= 3) {
        alert('You cannot include more than 3 copies of any card in your Main Deck.');
        return;
      }
      setMainDeck(mainDeck.map(item => 
        item.card.id === card.id ? { ...item, count: item.count + 1 } : item
      ));
    } else {
      setMainDeck([...mainDeck, { card, count: 1 }]);
    }
  };

  // Helper to remove card from main deck
  const removeFromMainDeck = (card) => {
    const existing = mainDeck.find(item => item.card.id === card.id);
    if (!existing) return;
    if (existing.count === 1) {
      setMainDeck(mainDeck.filter(item => item.card.id !== card.id));
    } else {
      setMainDeck(mainDeck.map(item => 
        item.card.id === card.id ? { ...item, count: item.count - 1 } : item
      ));
    }
  };

  // Helper to add card to rune deck
  const addToRuneDeck = (card) => {
    if (selectedLegend && !isCardDomainLegal(card)) {
      alert(`Cannot add ${card.name}. It does not match your Legend's domain identity (${allowedDomains.join('/')}).`);
      return;
    }
    const existing = runeDeck.find(item => item.card.id === card.id);
    if (existing) {
      if (existing.count >= 4) { // Let's allow up to 4 for runes
        alert('You cannot include more than 4 copies of any individual Rune.');
        return;
      }
      setRuneDeck(runeDeck.map(item => 
        item.card.id === card.id ? { ...item, count: item.count + 1 } : item
      ));
    } else {
      setRuneDeck([...runeDeck, { card, count: 1 }]);
    }
  };

  // Helper to remove card from rune deck
  const removeFromRuneDeck = (card) => {
    const existing = runeDeck.find(item => item.card.id === card.id);
    if (!existing) return;
    if (existing.count === 1) {
      setRuneDeck(runeDeck.filter(item => item.card.id !== card.id));
    } else {
      setRuneDeck(runeDeck.map(item => 
        item.card.id === card.id ? { ...item, count: item.count - 1 } : item
      ));
    }
  };

  // Toggle battlefields (max 3)
  const toggleBattlefield = (card) => {
    const isSelected = selectedBattlefields.some(b => b.id === card.id);
    if (isSelected) {
      setSelectedBattlefields(selectedBattlefields.filter(b => b.id !== card.id));
    } else {
      if (selectedBattlefields.length >= 3) {
        alert('You can only select exactly 3 Battlefields.');
        return;
      }
      setSelectedBattlefields([...selectedBattlefields, card]);
    }
  };

  // Select legend
  const selectLegend = (legend) => {
    setSelectedLegend(legend);
    // Auto-clean illegal cards from current deck if they violate new domains
    const newDomains = legend.domains;
    setMainDeck(prev => prev.filter(item => item.card.domains.some(d => newDomains.includes(d))));
    setRuneDeck(prev => prev.filter(item => item.card.domains.some(d => newDomains.includes(d))));
    if (selectedChampion && !selectedChampion.domains.some(d => newDomains.includes(d))) {
      setSelectedChampion(null);
    }
  };

  // Select champion
  const selectChampion = (champ) => {
    if (selectedLegend && !isCardDomainLegal(champ)) {
      alert(`Cannot select ${champ.name}. It does not match your Legend's domain identity (${allowedDomains.join('/')}).`);
      return;
    }
    setSelectedChampion(champ);
  };

  // Clear entire deck
  const clearDeck = () => {
    setSelectedLegend(null);
    setSelectedChampion(null);
    setMainDeck([]);
    setRuneDeck([]);
    setSelectedBattlefields([]);
  };

  // Load a complete sample deck for demonstration
  const loadSampleDeck = () => {
    // 1. Choose Steam Arcanist (Fire/Water Legend)
    const legend = MOCK_CARDS.legends.find(l => l.id === 'l5');
    setSelectedLegend(legend);

    // 2. Choose Fizz (Water Champion)
    const champ = MOCK_CARDS.champions.find(c => c.id === 'c5');
    setSelectedChampion(champ);

    // 3. Set up Main Deck (40 cards total)
    // 3 x Fire Adept, 3 x Flame Burst, 3 x Ignite, 3 x Sunfire Aegis, 3 x Infernus Dragon (15 Fire cards)
    // 3 x Tidecaller, 3 x Frostbite, 3 x Aqua Barrier, 3 x Abyssal Mask, 3 x Leviathan (15 Water cards)
    // 2 x Statikk Shiv, 2 x Cloud Scout, 3 x Wind Wall, 3 x Zephyr Strike (10 Air cards? Wait, Steam Arcanist is Fire/Water, so Air is illegal!
    // Let's make it 4 x some cards or fill up to 40 with Fire/Water cards only.
    // 40 cards:
    // Fire Adept (3), Flame Burst (3), Ignite (3), Sunfire Aegis (3), Infernus (3) -> 15
    // Tidecaller (3), Frostbite (3), Aqua Barrier (3), Abyssal Mask (3), Leviathan (3) -> 15
    // Flame Burst (another copies? No, max 3 copies). Let's do 8 distinct cards * 3 = 24, plus 4 cards * 3 = 12, plus 4 cards.
    // Let's assign:
    // m1: 3, m2: 3, m3: 3, m4: 3, m5: 2 (14 Fire)
    // m6: 3, m7: 3, m8: 3, m9: 3, m10: 2 (14 Water)
    // plus m1, m2, m3 are already at 3. We have m1 (3), m2 (3), m3 (3), m4 (3), m5 (3) = 15.
    // m6 (3), m7 (3), m8 (3), m9 (3), m10 (3) = 15.
    // That's 30 cards. We need 10 more Fire/Water cards:
    // Let's add other combinations or allow them. Wait, let's look at cards.js.
    // Fire cards: m1-m5. Water cards: m6-m10. Earth: m11-m15. Air: m16-m20.
    // So for Fire/Water we only have 10 total cards. To make exactly 40, we will add 3 copies of m1-m10 (30 cards)
    // And add 2 copies of m1, m2, etc? No, max 3 copies of any card!
    // Ah! With 10 cards and a limit of 3 copies each, the maximum possible cards in a Fire/Water deck is 10 * 3 = 30.
    // Let's change the sample deck to a Legend with all domains, or choose a 3-domain legend, or just select a Legend that allows 3 domains (e.g. we can load a sample deck matching a 2-domain identity but we need more cards in cards.js to reach 40. Or we can just load a sample deck of 3 domains like Water/Air/Earth, wait, or let's load a Water/Air deck:
    // Water (m6-m10, 5 cards * 3 = 15), Air (m16-m20, 5 cards * 3 = 15). That is still 30.
    // Wait, let's load a sample deck of 40 cards where we lift the domain check temporarily or just add some duplicates or let's create a custom load. Wait! A standard Legend has 2 domains, but to hit 40 cards with only 10 unique cards in those 2 domains, we would need 4 copies of some or more cards in cards.js. Let's just add enough copies to hit 40, or we can add 3 copies of m1-m10 (30 cards) and 2 copies of some runes? No, runes go in the Rune Deck.
    // Let's check: to hit 40, we can just allow the sample deck to have some Earth or Air cards and explain it, or select a Legend that allows all domains for the sample deck, or simply set the sample deck to have 40 cards by adding cards across Fire, Water, and Air, using Tidal Sage (Water) and adding other cards. Actually, let's select Tidal Sage (Water) but load 30 cards, or let's add more card definitions to cards.js?
    // Wait! Let's look at the cards.js. We have 20 cards in `mainDeck`. That means across all 4 domains, we have 20 cards * 3 copies = 60 cards max.
    // If a Legend permits 3 domains (or we select Steam Arcanist and add some Neutral cards, or let the user choose), let's just make the sample deck use a Legend like Tidal Sage, and for the demonstration, we'll populate 40 cards including some out-of-domain cards if needed, OR we can select Steam Arcanist (Fire/Water) and fill it with Fire and Water cards, and add a few Earth cards (noting that they violate domain identity for validation demo!). That is actually extremely clever, because it shows how the validation system highlights illegal cards!
    // Yes! Let's load 30 legal cards and 10 illegal cards (Earth/Air) to showcase the domain validation in action.
    setMainDeck([
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm1'), count: 3 }, // Fire Adept
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm2'), count: 3 }, // Flame Burst
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm3'), count: 3 }, // Ignite
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm4'), count: 3 }, // Sunfire Aegis
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm5'), count: 3 }, // Infernus Dragon
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm6'), count: 3 }, // Tidecaller
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm7'), count: 3 }, // Frostbite
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm8'), count: 3 }, // Aqua Barrier
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm9'), count: 3 }, // Abyssal Mask
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm10'), count: 3 }, // Leviathan
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm11'), count: 3 }, // Vanguard Defender (Earth - Illegal for Fire/Water!)
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm12'), count: 3 }, // Decisive Strike (Earth - Illegal for Fire/Water!)
      { card: MOCK_CARDS.mainDeck.find(m => m.id === 'm16'), count: 4 }  // Cloud Scout (Air - Illegal, and 4 copies to trigger count warning!)
    ]);

    // 4. Rune deck: 12 runes (6 Fire, 6 Water)
    setRuneDeck([
      { card: MOCK_CARDS.runes.find(r => r.id === 'r1'), count: 6 },
      { card: MOCK_CARDS.runes.find(r => r.id === 'r2'), count: 6 }
    ]);

    // 5. Battlefields: 3 battlefields
    setSelectedBattlefields([
      MOCK_CARDS.battlefields[0],
      MOCK_CARDS.battlefields[1],
      MOCK_CARDS.battlefields[2]
    ]);
  };

  // Filtered card pool based on search, active tab, and domain filter
  const filteredCardPool = useMemo(() => {
    let pool = [];
    if (activePoolTab === 'legends') pool = MOCK_CARDS.legends;
    else if (activePoolTab === 'champions') pool = MOCK_CARDS.champions;
    else if (activePoolTab === 'runes') pool = MOCK_CARDS.runes;
    else if (activePoolTab === 'main') pool = MOCK_CARDS.mainDeck;
    else if (activePoolTab === 'battlefields') pool = MOCK_CARDS.battlefields;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      pool = pool.filter(card => card.name.toLowerCase().includes(query) || card.text.toLowerCase().includes(query));
    }

    // Domain filter
    if (domainFilter !== 'all') {
      pool = pool.filter(card => card.domains && card.domains.includes(domainFilter));
    }

    return pool;
  }, [activePoolTab, searchQuery, domainFilter]);

  // Validation checks
  const validationResults = useMemo(() => {
    const checks = {
      hasLegend: selectedLegend !== null,
      hasChampion: selectedChampion !== null,
      mainDeckSize: mainDeckCount === 40,
      runeDeckSize: runeDeckCount === 12,
      battlefieldsCount: selectedBattlefields.length === 3,
      domainLegality: true,
      cardCopiesLegality: true,
    };

    // Check domain legality of all cards in deck
    if (selectedLegend) {
      const allDeckCards = [
        ...mainDeck.map(i => i.card),
        ...runeDeck.map(i => i.card),
        ...(selectedChampion ? [selectedChampion] : [])
      ];
      const hasIllegal = allDeckCards.some(card => !isCardDomainLegal(card));
      checks.domainLegality = !hasIllegal;
    }

    // Check for > 3 copies of any main deck card (or any custom count error)
    const hasCopyViolations = mainDeck.some(item => item.count > 3);
    checks.cardCopiesLegality = !hasCopyViolations;

    return {
      checks,
      isValid: Object.values(checks).every(v => v === true)
    };
  }, [selectedLegend, selectedChampion, mainDeck, runeDeck, selectedBattlefields, mainDeckCount, runeDeckCount]);

  // Export Deck list
  const exportDeck = () => {
    let text = `== RIFTBOUND DECK LIST ==\n\n`;
    text += `LEGEND:\n${selectedLegend ? `- ${selectedLegend.name} [${selectedLegend.domains.join('/')}]` : '(None Selected)'}\n\n`;
    text += `CHAMPION:\n${selectedChampion ? `- ${selectedChampion.name} [Cost ${selectedChampion.cost}]` : '(None Selected)'}\n\n`;
    
    text += `MAIN DECK (${mainDeckCount} / 40):\n`;
    if (mainDeck.length === 0) text += `- No cards\n`;
    else {
      mainDeck.forEach(item => {
        text += `- ${item.count}x ${item.card.name} (${item.card.type}) [${item.card.domains.join('/')}]\n`;
      });
    }
    text += `\nRUNE DECK (${runeDeckCount} / 12):\n`;
    if (runeDeck.length === 0) text += `- No runes\n`;
    else {
      runeDeck.forEach(item => {
        text += `- ${item.count}x ${item.card.name}\n`;
      });
    }
    text += `\nBATTLEFIELDS (${selectedBattlefields.length} / 3):\n`;
    if (selectedBattlefields.length === 0) text += `- No battlefields\n`;
    else {
      selectedBattlefields.forEach(b => {
        text += `- ${b.name}\n`;
      });
    }

    setExportText(text);
    setShowExportModal(true);

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      // Successfully copied
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <Container fluid className="py-4 text-light bg-dark-custom min-vh-100">
      <Row className="mb-4 align-items-center">
        <Col md={8}>
          <h1 className="fs-3 fw-bold text-gold m-0 text-glow">Riftbound Deck Builder</h1>
          <p className="text-muted m-0 small">Create, validate, and export client-side Riftbound TCG decklists</p>
        </Col>
        <Col md={4} className="text-md-end mt-2 mt-md-0">
          <Button variant="outline-danger" size="sm" className="me-2" onClick={clearDeck}>
            🗑️ Clear Deck
          </Button>
          <Button variant="outline-warning" size="sm" className="me-2" onClick={loadSampleDeck}>
            🧪 Load Sample Deck
          </Button>
          <Button variant="cyan" size="sm" onClick={exportDeck}>
            📋 Export & Copy
          </Button>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Left Side: Card Pool Browser */}
        <Col lg={7}>
          <Card className="card-glass h-100 border-secondary-subtle">
            <Card.Header className="bg-transparent border-bottom border-secondary-subtle pt-3">
              <Row className="g-2">
                <Col md={5}>
                  <Form.Control
                    type="text"
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-dark text-light border-secondary"
                  />
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="bg-dark text-light border-secondary"
                  >
                    <option value="all">All Domains</option>
                    <option value="Fire">🔥 Fire</option>
                    <option value="Water">💧 Water</option>
                    <option value="Earth">🪵 Earth</option>
                    <option value="Air">⚡ Air</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="text-end">
                  {selectedLegend && (
                    <div className="d-inline-block p-2 bg-dark rounded border border-warning small">
                      Identity: {allowedDomains.map(d => (
                        <span key={d} className={`mx-1 fw-bold text-${d.toLowerCase()}`}>
                          {d === 'Fire' ? '🔥' : d === 'Water' ? '💧' : d === 'Earth' ? '🪵' : '⚡'}{d}
                        </span>
                      ))}
                    </div>
                  )}
                </Col>
              </Row>
              
              <Nav variant="tabs" className="mt-3 border-0" activeKey={activePoolTab} onSelect={(k) => setActivePoolTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="legends" className="nav-tab-custom">Legends</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="champions" className="nav-tab-custom">Champions</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="main" className="nav-tab-custom">Main Deck</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="runes" className="nav-tab-custom">Runes</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="battlefields" className="nav-tab-custom">Battlefields</Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body className="card-pool-scroll p-3">
              {filteredCardPool.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="fs-5">No matching cards found.</p>
                  <p className="small">Try adjusting your search query or domain filters.</p>
                </div>
              ) : (
                <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                  {filteredCardPool.map(card => {
                    const isSelectedBF = selectedBattlefields.some(b => b.id === card.id);
                    const isSelectedLegend = selectedLegend && selectedLegend.id === card.id;
                    const isSelectedChamp = selectedChampion && selectedChampion.id === card.id;
                    
                    let cardCount = 0;
                    if (card.type === 'Rune') {
                      cardCount = runeDeck.find(i => i.card.id === card.id)?.count || 0;
                    } else if (card.type !== 'Legend' && card.type !== 'Champion' && card.type !== 'Battlefield') {
                      cardCount = mainDeck.find(i => i.card.id === card.id)?.count || 0;
                    }

                    const isLegal = isCardDomainLegal(card);

                    return (
                      <Col key={card.id}>
                        <Card className={`h-100 card-tcg bg-dark border-secondary ${!isLegal ? 'opacity-50 border-danger-subtle' : ''}`}>
                          <Card.Body className="d-flex flex-column p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Badge bg={
                                card.domains ? (card.domains[0] === 'Fire' ? 'danger' : card.domains[0] === 'Water' ? 'primary' : card.domains[0] === 'Earth' ? 'warning text-dark' : 'info text-dark') : 'secondary'
                              } className="text-uppercase">
                                {card.domains ? card.domains.join('/') : 'Neutral'}
                              </Badge>
                              {card.cost !== undefined && (
                                <Badge bg="dark" className="border border-secondary">
                                  💎 {card.cost}
                                </Badge>
                              )}
                            </div>
                            
                            <Card.Title className="fs-6 fw-bold text-light mb-1">{card.name}</Card.Title>
                            <Card.Subtitle className="small text-muted mb-2">{card.type}</Card.Subtitle>
                            
                            <Card.Text className="small flex-grow-1 text-secondary-glow card-text-custom">
                              {card.text}
                            </Card.Text>

                            {card.power !== undefined && card.health !== undefined && (
                              <div className="d-flex gap-2 mb-2 justify-content-between small text-gold fw-bold">
                                <span>⚔️ Power: {card.power}</span>
                                <span>❤️ Health: {card.health}</span>
                              </div>
                            )}

                            {!isLegal && (
                              <div className="text-danger small mb-2 fw-bold">⚠️ Domain Mismatch</div>
                            )}

                            <div className="d-grid mt-2">
                              {card.type === 'Legend' ? (
                                <Button 
                                  variant={isSelectedLegend ? "gold" : "outline-gold"} 
                                  size="sm"
                                  onClick={() => selectLegend(card)}
                                >
                                  {isSelectedLegend ? "Active Legend" : "Select Legend"}
                                </Button>
                              ) : card.type === 'Champion' ? (
                                <Button 
                                  variant={isSelectedChamp ? "cyan" : "outline-cyan"} 
                                  size="sm"
                                  onClick={() => selectChampion(card)}
                                >
                                  {isSelectedChamp ? "Active Champion" : "Select Champion"}
                                </Button>
                              ) : card.type === 'Battlefield' ? (
                                <Button 
                                  variant={isSelectedBF ? "success" : "outline-secondary"} 
                                  size="sm"
                                  onClick={() => toggleBattlefield(card)}
                                >
                                  {isSelectedBF ? "Selected" : "Add Battlefield"}
                                </Button>
                              ) : card.type === 'Rune' ? (
                                <div className="d-flex gap-1">
                                  <Button variant="outline-danger" size="sm" className="px-2" onClick={() => removeFromRuneDeck(card)}>-</Button>
                                  <span className="form-control form-control-sm text-center bg-dark text-light border-secondary">{cardCount}</span>
                                  <Button variant="outline-success" size="sm" className="px-2" onClick={() => addToRuneDeck(card)}>+</Button>
                                </div>
                              ) : (
                                <div className="d-flex gap-1">
                                  <Button variant="outline-danger" size="sm" className="px-2" onClick={() => removeFromMainDeck(card)}>-</Button>
                                  <span className="form-control form-control-sm text-center bg-dark text-light border-secondary">{cardCount}</span>
                                  <Button variant="outline-success" size="sm" className="px-2" onClick={() => addToMainDeck(card)}>+</Button>
                                </div>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Side: Active Deck & Validation Checklist */}
        <Col lg={5}>
          {/* Validation Panel */}
          <Card className="card-glass border-secondary-subtle mb-4">
            <Card.Header className="bg-transparent border-bottom border-secondary-subtle">
              <h2 className="fs-5 text-gold fw-bold m-0 py-1">Deck Checklist</h2>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg={validationResults.checks.hasLegend ? "success" : "danger"} className="p-2">
                  {validationResults.checks.hasLegend ? "✓ Legend Selected" : "✗ Legend Missing"}
                </Badge>
                <Badge bg={validationResults.checks.hasChampion ? "success" : "danger"} className="p-2">
                  {validationResults.checks.hasChampion ? "✓ Champion Selected" : "✗ Champion Missing"}
                </Badge>
                <Badge bg={validationResults.checks.mainDeckSize ? "success" : (mainDeckCount > 40 ? "danger" : "warning text-dark")} className="p-2">
                  📦 Main Deck: {mainDeckCount} / 40
                </Badge>
                <Badge bg={validationResults.checks.runeDeckSize ? "success" : (runeDeckCount > 12 ? "danger" : "warning text-dark")} className="p-2">
                  💎 Rune Deck: {runeDeckCount} / 12
                </Badge>
                <Badge bg={validationResults.checks.battlefieldsCount ? "success" : "warning text-dark"} className="p-2">
                  ⚔️ Battlefields: {selectedBattlefields.length} / 3
                </Badge>
                <Badge bg={validationResults.checks.domainLegality ? "success" : "danger"} className="p-2">
                  {validationResults.checks.domainLegality ? "✓ Domain Match" : "✗ Domain Violations"}
                </Badge>
                <Badge bg={validationResults.checks.cardCopiesLegality ? "success" : "danger"} className="p-2">
                  {validationResults.checks.cardCopiesLegality ? "✓ Limit Checked" : "✗ Exceeded Limit (>3)"}
                </Badge>
              </div>

              {validationResults.isValid ? (
                <Alert variant="success" className="m-0 py-2 border-0 bg-success-subtle text-success">
                  <strong>✓ Deck is Valid!</strong> Ready for tournament constructed play.
                </Alert>
              ) : (
                <Alert variant="warning" className="m-0 py-2 border-0 bg-warning-subtle text-warning">
                  <strong>⚠️ Deck is Invalid:</strong> Complete the Checklist to validate this list.
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Active Deck Overview */}
          <Card className="card-glass border-secondary-subtle">
            <Card.Header className="bg-transparent border-bottom border-secondary-subtle d-flex justify-content-between align-items-center">
              <h2 className="fs-5 text-cyan fw-bold m-0 py-1">Active Deck</h2>
              <span className="small text-muted">{mainDeckCount} Main | {runeDeckCount} Runes</span>
            </Card.Header>
            <Card.Body className="active-deck-scroll p-0">
              <ListGroup variant="flush">
                {/* Legend Row */}
                <ListGroup.Item className="bg-transparent border-bottom border-secondary-subtle text-light py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-gold text-uppercase tracking-wider fw-bold">Legend (1)</small>
                      <h4 className="fs-6 m-0 fw-bold">{selectedLegend ? selectedLegend.name : 'No Legend Selected'}</h4>
                    </div>
                    {selectedLegend && (
                      <Button variant="outline-danger" size="sm" onClick={() => setSelectedLegend(null)}>Remove</Button>
                    )}
                  </div>
                </ListGroup.Item>

                {/* Champion Row */}
                <ListGroup.Item className="bg-transparent border-bottom border-secondary-subtle text-light py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-cyan text-uppercase tracking-wider fw-bold">Champion (1)</small>
                      <h4 className="fs-6 m-0 fw-bold">
                        {selectedChampion ? selectedChampion.name : 'No Champion Selected'}
                        {selectedChampion && !isCardDomainLegal(selectedChampion) && (
                          <span className="text-danger ms-2 small">⚠️ Domain Mismatch</span>
                        )}
                      </h4>
                    </div>
                    {selectedChampion && (
                      <Button variant="outline-danger" size="sm" onClick={() => setSelectedChampion(null)}>Remove</Button>
                    )}
                  </div>
                </ListGroup.Item>

                {/* Battlefields */}
                <ListGroup.Item className="bg-transparent border-bottom border-secondary-subtle text-light py-3">
                  <small className="text-success text-uppercase tracking-wider fw-bold d-block mb-2">Battlefields ({selectedBattlefields.length} / 3)</small>
                  {selectedBattlefields.length === 0 ? (
                    <span className="text-muted small">No Battlefields selected. Add from the browser.</span>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {selectedBattlefields.map(b => (
                        <Badge key={b.id} bg="success" className="p-2 d-flex align-items-center gap-2">
                          {b.name}
                          <span 
                            className="text-white fw-bold cursor-pointer hover-red" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleBattlefield(b)}
                          >
                            ×
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </ListGroup.Item>

                {/* Main Deck List */}
                <ListGroup.Item className="bg-transparent border-bottom border-secondary-subtle text-light py-3">
                  <small className="text-purple text-uppercase tracking-wider fw-bold d-block mb-2">Main Deck ({mainDeckCount} / 40)</small>
                  {mainDeck.length === 0 ? (
                    <span className="text-muted small">No cards in Main Deck. Add from the browser.</span>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {mainDeck.map(item => {
                        const isLegal = isCardDomainLegal(item.card);
                        return (
                          <div key={item.card.id} className="d-flex justify-content-between align-items-center bg-dark p-2 rounded border border-secondary">
                            <div>
                              <span className="fw-bold text-gold me-2">{item.count}x</span>
                              <span className={!isLegal ? 'text-danger text-decoration-line-through' : ''}>{item.card.name}</span>
                              <span className="text-muted small ms-2">({item.card.type})</span>
                              {item.count > 3 && <Badge bg="danger" className="ms-2">Limit Viol.</Badge>}
                              {!isLegal && <span className="text-danger small ms-2">⚠️ Domain Mismatch</span>}
                            </div>
                            <div className="d-flex gap-1">
                              <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => removeFromMainDeck(item.card)}>-</Button>
                              <Button variant="outline-success" size="sm" className="py-0 px-2" onClick={() => addToMainDeck(item.card)}>+</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ListGroup.Item>

                {/* Rune Deck List */}
                <ListGroup.Item className="bg-transparent text-light py-3">
                  <small className="text-info text-uppercase tracking-wider fw-bold d-block mb-2">Rune Deck ({runeDeckCount} / 12)</small>
                  {runeDeck.length === 0 ? (
                    <span className="text-muted small">No Runes selected. Add from the browser.</span>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {runeDeck.map(item => {
                        const isLegal = isCardDomainLegal(item.card);
                        return (
                          <div key={item.card.id} className="d-flex justify-content-between align-items-center bg-dark p-2 rounded border border-secondary">
                            <div>
                              <span className="fw-bold text-cyan me-2">{item.count}x</span>
                              <span className={!isLegal ? 'text-danger text-decoration-line-through' : ''}>{item.card.name}</span>
                              {!isLegal && <span className="text-danger small ms-2">⚠️ Domain Mismatch</span>}
                            </div>
                            <div className="d-flex gap-1">
                              <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => removeFromRuneDeck(item.card)}>-</Button>
                              <Button variant="outline-success" size="sm" className="py-0 px-2" onClick={() => addToRuneDeck(item.card)}>+</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Export Output Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-dark text-light border-secondary">
          <Modal.Title className="text-gold font-bold">📋 Deck List Exported!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          <p className="small text-muted">The deck list has been copied to your clipboard. You can paste it into Discord, text files, or other deck trackers.</p>
          <Form.Control
            as="textarea"
            rows={12}
            value={exportText}
            readOnly
            className="bg-black text-light font-monospace border-secondary"
          />
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="outline-gold" onClick={() => setShowExportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
