import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Tab, Nav, Alert, Modal } from 'react-bootstrap';
import { MOCK_CARDS } from '../data/cards';
import { getAccountByRiotId, getSummonerByPuuid, getTopMasteriesByPuuid, CHAMPION_ID_MAP, isApiKeyAvailable, fetchRiftboundContent, transformRiftboundContent } from '../services/riotApi';

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

  // Riot API Sync State
  const [riotId, setRiotId] = useState('');
  const [riotPlatform, setRiotPlatform] = useState('NA1');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [summonerProfile, setSummonerProfile] = useState(null);
  const [topMasteries, setTopMasteries] = useState([]);
  const [recommendedChampions, setRecommendedChampions] = useState([]);

  // Dynamic Card Pool State
  const [cardDatabase, setCardDatabase] = useState(MOCK_CARDS);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingCardsError, setLoadingCardsError] = useState(null);
  const [cardDatabaseSource, setCardDatabaseSource] = useState('mock');

  React.useEffect(() => {
    const loadApiCards = async () => {
      if (!isApiKeyAvailable()) {
        return; // Fall back to offline MOCK_CARDS
      }
      setLoadingCards(true);
      setLoadingCardsError(null);
      try {
        const data = await fetchRiftboundContent(riotPlatform);
        const parsed = transformRiftboundContent(data);
        if (parsed.legends.length > 0 || parsed.champions.length > 0 || parsed.mainDeck.length > 0) {
          setCardDatabase(parsed);
          setCardDatabaseSource('api');
        }
      } catch (error) {
        console.warn('Riot Content API fetch failed, falling back to mock database:', error);
        let msg = 'Failed to load live cards from Riot API. Using offline mock database.';
        if (!import.meta.env.DEV) {
          msg += ' (Note: Direct content API fetches are blocked by CORS in production browsers.)';
        }
        setLoadingCardsError(msg);
      } finally {
        setLoadingCards(false);
      }
    };
    loadApiCards();
  }, []);

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
    // 1. Choose Legend (Steam Arcanist or first available)
    const legend = cardDatabase.legends.find(l => l.name.includes('Steam') || l.id === 'l5') || cardDatabase.legends[0] || MOCK_CARDS.legends[0];
    setSelectedLegend(legend);

    // 2. Choose Champion compatible with Legend's domains
    const allowed = legend.domains;
    const champ = cardDatabase.champions.find(c => c.domains.some(d => allowed.includes(d))) || cardDatabase.champions[0] || MOCK_CARDS.champions[0];
    setSelectedChampion(champ);

    // 3. Set up Main Deck (40 cards total)
    const legalMainCards = cardDatabase.mainDeck.filter(m => m.domains.some(d => allowed.includes(d)));
    const deck = [];
    let total = 0;
    
    if (legalMainCards.length > 0) {
      for (const card of legalMainCards) {
        if (total >= 40) break;
        const count = Math.min(3, 40 - total);
        deck.push({ card, count });
        total += count;
      }
    }
    
    if (total < 40 && cardDatabaseSource === 'mock') {
      // Revert to original static mock values to guarantee 40 cards with violations demo
      setMainDeck([
        { card: cardDatabase.mainDeck.find(m => m.id === 'm1'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm2'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm3'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm4'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm5'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm6'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm7'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm8'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm9'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm10'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm11'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm12'), count: 3 },
        { card: cardDatabase.mainDeck.find(m => m.id === 'm16'), count: 4 }
      ]);
    } else {
      setMainDeck(deck);
    }

    // 4. Set up Rune Deck (12 runes)
    const legalRunes = cardDatabase.runes.filter(r => r.domains.some(d => allowed.includes(d)));
    const runes = [];
    let runeTotal = 0;
    
    if (legalRunes.length > 0) {
      for (const rune of legalRunes) {
        if (runeTotal >= 12) break;
        const count = Math.min(3, 12 - runeTotal);
        runes.push({ card: rune, count });
        runeTotal += count;
      }
    }
    
    if (runeTotal < 12 && cardDatabaseSource === 'mock') {
      setRuneDeck([
        { card: cardDatabase.runes.find(r => r.id === 'r1'), count: 6 },
        { card: cardDatabase.runes.find(r => r.id === 'r2'), count: 6 }
      ]);
    } else {
      setRuneDeck(runes);
    }

    // 5. Battlefields: 3 battlefields
    setSelectedBattlefields(cardDatabase.battlefields.slice(0, 3));
  };

  // Filtered card pool based on search, active tab, and domain filter
  const filteredCardPool = useMemo(() => {
    let pool = [];
    if (activePoolTab === 'legends') pool = cardDatabase.legends;
    else if (activePoolTab === 'champions') pool = cardDatabase.champions;
    else if (activePoolTab === 'runes') pool = cardDatabase.runes;
    else if (activePoolTab === 'main') pool = cardDatabase.mainDeck;
    else if (activePoolTab === 'battlefields') pool = cardDatabase.battlefields;

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
  }, [activePoolTab, searchQuery, domainFilter, cardDatabase]);

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

  const handleRiotSync = async () => {
    if (!riotId.trim()) {
      setSyncError('Please enter your Riot ID (Name#Tag).');
      return;
    }
    setSyncLoading(true);
    setSyncError(null);
    try {
      // 1. Resolve Account PUUID
      const account = await getAccountByRiotId(riotId, riotPlatform);
      
      // 2. Fetch Summoner Info
      const summoner = await getSummonerByPuuid(account.puuid, riotPlatform);
      
      // 3. Fetch Masteries
      const masteries = await getTopMasteriesByPuuid(account.puuid, riotPlatform, 5);
      
      setSummonerProfile({
        name: account.gameName,
        tag: account.tagLine,
        level: summoner.summonerLevel,
        iconId: summoner.profileIconId,
      });

      // Map mastery champion names
      const mappedMasteries = masteries.map(m => ({
        championId: m.championId,
        points: m.championPoints,
        level: m.championLevel,
        name: CHAMPION_ID_MAP[m.championId] || `Unknown Champ (${m.championId})`,
        inGameCard: CHAMPION_ID_MAP[m.championId] || null,
      }));
      setTopMasteries(mappedMasteries);

      // Determine recommended Riftbound champions
      const recommended = mappedMasteries
        .filter(m => m.inGameCard)
        .map(m => m.inGameCard);
      setRecommendedChampions(recommended);
    } catch (err) {
      console.error(err);
      let errMsg = err.message || 'An error occurred during synchronization.';
      if (!import.meta.env.DEV) {
        errMsg += ' (Note: Direct Riot API calls are blocked by CORS in production/browser environments. To test, please run this app locally.)';
      }
      setSyncError(errMsg);
    } finally {
      setSyncLoading(false);
    }
  };

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
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h1 className="fs-3 fw-bold text-gold m-0 text-glow">Riftbound Deck Builder</h1>
            {loadingCards ? (
              <Badge bg="secondary" className="px-2 py-1 animate-pulse">
                ⏳ Loading Cards...
              </Badge>
            ) : (
              <Badge bg={cardDatabaseSource === 'api' ? "success" : "secondary"} className="px-2 py-1">
                {cardDatabaseSource === 'api' ? "🟢 Live API Cards" : "⚪ Offline Cards"}
              </Badge>
            )}
          </div>
          <p className="text-muted m-0 small">Create, validate, and export client-side Riftbound TCG decklists</p>
          {loadingCardsError && (
            <Alert variant="info" className="py-1 px-3 mt-2 mb-0 border-0 bg-info-subtle text-info small d-inline-block">
              {loadingCardsError}
            </Alert>
          )}
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

                    const domainClass = card.domains && card.domains.length > 0 ? `border-${card.domains[0].toLowerCase()}` : '';
                    let heightClass = 'height-short';
                    if (card.type === 'Legend' || card.type === 'Champion') heightClass = 'height-tall';
                    else if (card.type === 'Battlefield') heightClass = 'height-medium';

                    return (
                      <Col key={card.id}>
                        <Card className={`h-100 card-tcg bg-dark ${domainClass} ${!isLegal ? 'opacity-50 border-danger-subtle' : ''}`}>
                          {card.image && (
                            <div className={`card-img-container ${heightClass}`}>
                              <img src={card.image} alt={card.name} loading="lazy" />
                            </div>
                          )}
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
                            
                            <Card.Title className="fs-6 fw-bold text-light mb-1 d-flex align-items-center justify-content-between flex-wrap gap-1">
                              <span>{card.name}</span>
                              {card.type === 'Champion' && recommendedChampions.includes(card.name) && (
                                <Badge bg="warning" text="dark" className="small border border-warning" style={{ fontSize: '0.65rem' }}>
                                  ★ Recommended Main
                                </Badge>
                              )}
                            </Card.Title>
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
          {/* Riot API Profile Sync Panel */}
          <Card className="card-glass border-secondary-subtle mb-4">
            <Card.Header className="bg-transparent border-bottom border-secondary-subtle d-flex justify-content-between align-items-center">
              <h2 className="fs-5 text-cyan fw-bold m-0 py-1">Riot Profile Sync</h2>
              <Badge bg={isApiKeyAvailable() ? "success" : "danger"}>
                {isApiKeyAvailable() ? "API Key Loaded" : "No API Key"}
              </Badge>
            </Card.Header>
            <Card.Body className="p-3">
              {!isApiKeyAvailable() ? (
                <div className="small text-muted text-center py-2">
                  <p className="m-0">⚠️ To link your League of Legends account and receive deck suggestions based on your masteries, please add your Riot API key to <code>APIkey.txt</code> and restart the development server.</p>
                </div>
              ) : (
                <>
                  <Form onSubmit={(e) => { e.preventDefault(); handleRiotSync(); }}>
                    <Row className="g-2 align-items-end mb-3">
                      <Col xs={7}>
                        <Form.Group controlId="riotIdInput">
                          <Form.Label className="small text-muted mb-1">Riot ID (Name#Tag)</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. BrandMain#NA1"
                            value={riotId}
                            onChange={(e) => setRiotId(e.target.value)}
                            className="bg-dark text-light border-secondary form-control-sm"
                            disabled={syncLoading}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={5}>
                        <Form.Group controlId="riotPlatformSelect">
                          <Form.Label className="small text-muted mb-1">Server Region</Form.Label>
                          <Form.Select
                            value={riotPlatform}
                            onChange={(e) => setRiotPlatform(e.target.value)}
                            className="bg-dark text-light border-secondary form-control-sm"
                            disabled={syncLoading}
                          >
                            <option value="NA1">North America</option>
                            <option value="EUW1">Europe West</option>
                            <option value="EUN1">Europe Nordic & East</option>
                            <option value="KR">Korea</option>
                            <option value="OC1">Oceania</option>
                            <option value="BR1">Brazil</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-grid">
                      <Button 
                        type="submit" 
                        variant="outline-cyan" 
                        size="sm" 
                        disabled={syncLoading}
                      >
                        {syncLoading ? 'Syncing...' : '🔄 Link Account & Sync Mastery'}
                      </Button>
                    </div>
                  </Form>

                  {syncError && (
                    <Alert variant="danger" className="mt-3 p-2 small border-0 bg-danger-subtle text-danger">
                      {syncError}
                    </Alert>
                  )}

                  {summonerProfile && (
                    <div className="mt-3 p-3 bg-dark rounded border border-secondary-subtle">
                      <div className="d-flex align-items-center mb-3">
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summonerProfile.iconId}.png`} 
                          alt="Icon" 
                          className="rounded-circle border border-warning me-3"
                          style={{ width: '48px', height: '48px' }}
                        />
                        <div>
                          <h4 className="fs-6 m-0 fw-bold text-light">{summonerProfile.name} <span className="text-muted">#{summonerProfile.tag}</span></h4>
                          <span className="small text-gold">Level {summonerProfile.level}</span>
                        </div>
                      </div>

                      <h5 className="fs-6 text-gold mb-2 border-bottom border-secondary-subtle pb-1">Top Champion Masteries</h5>
                      <ListGroup variant="flush" className="bg-transparent">
                        {topMasteries.map((m, idx) => (
                          <ListGroup.Item key={idx} className="bg-transparent border-0 text-light p-1 d-flex justify-content-between align-items-center small">
                            <span>
                              <span className="text-muted me-2">{idx + 1}.</span>
                              <strong className={m.inGameCard ? "text-cyan" : ""}>{m.name.split(',')[0]}</strong>
                              <span className="text-muted ms-2">(Lvl {m.level})</span>
                            </span>
                            <span className="d-flex align-items-center gap-2">
                              <span className="text-muted">{m.points.toLocaleString()} pts</span>
                              {m.inGameCard && (
                                <Badge bg="warning" text="dark" className="small">Riftbound Card!</Badge>
                              )}
                            </span>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>

                      {recommendedChampions.length > 0 && (
                        <div className="mt-3 alert alert-info p-2 small border-0 m-0 bg-info-subtle text-info">
                          <strong>💡 Mastery Recommendations:</strong> Top masteries match <strong>{recommendedChampions.map(c => c.split(',')[0]).join(', ')}</strong> in our card pool. They have been highlighted in the browser!
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>

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
                    <div className="d-flex align-items-center">
                      {selectedLegend && selectedLegend.image && (
                        <img src={selectedLegend.image} className="deck-list-thumbnail me-2" alt="" />
                      )}
                      <div>
                        <small className="text-gold text-uppercase tracking-wider fw-bold">Legend (1)</small>
                        <h4 className="fs-6 m-0 fw-bold">{selectedLegend ? selectedLegend.name : 'No Legend Selected'}</h4>
                      </div>
                    </div>
                    {selectedLegend && (
                      <Button variant="outline-danger" size="sm" onClick={() => setSelectedLegend(null)}>Remove</Button>
                    )}
                  </div>
                </ListGroup.Item>

                {/* Champion Row */}
                <ListGroup.Item className="bg-transparent border-bottom border-secondary-subtle text-light py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {selectedChampion && selectedChampion.image && (
                        <img src={selectedChampion.image} className="deck-list-thumbnail me-2" alt="" />
                      )}
                      <div>
                        <small className="text-cyan text-uppercase tracking-wider fw-bold">Champion (1)</small>
                        <h4 className="fs-6 m-0 fw-bold">
                          {selectedChampion ? selectedChampion.name : 'No Champion Selected'}
                          {selectedChampion && !isCardDomainLegal(selectedChampion) && (
                            <span className="text-danger ms-2 small">⚠️ Domain Mismatch</span>
                          )}
                        </h4>
                      </div>
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
                    <div className="d-flex flex-column gap-2">
                      {selectedBattlefields.map(b => (
                        <div key={b.id} className="d-flex justify-content-between align-items-center bg-dark p-2 rounded border border-secondary">
                          <div className="d-flex align-items-center">
                            {b.image && (
                              <img src={b.image} className="deck-list-thumbnail me-2" alt="" />
                            )}
                            <span>{b.name}</span>
                          </div>
                          <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => toggleBattlefield(b)}>×</Button>
                        </div>
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
                            <div className="d-flex align-items-center">
                              <span className="fw-bold text-gold me-2">{item.count}x</span>
                              {item.card.image && (
                                <img src={item.card.image} className="deck-list-thumbnail me-2" alt="" />
                              )}
                              <div>
                                <span className={!isLegal ? 'text-danger text-decoration-line-through text-muted' : ''}>{item.card.name}</span>
                                <div className="text-muted small">({item.card.type})</div>
                              </div>
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
                            <div className="d-flex align-items-center">
                              <span className="fw-bold text-cyan me-2">{item.count}x</span>
                              {item.card.image && (
                                <img src={item.card.image} className="deck-list-thumbnail me-2" alt="" />
                              )}
                              <div>
                                <span className={!isLegal ? 'text-danger text-decoration-line-through text-muted' : ''}>{item.card.name}</span>
                                {!isLegal && <span className="text-danger small ms-2">⚠️ Domain Mismatch</span>}
                              </div>
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
