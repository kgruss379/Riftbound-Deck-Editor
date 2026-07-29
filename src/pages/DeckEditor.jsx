import React, { useState, useMemo, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Tab, Nav, Alert, Modal, InputGroup } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { CARDS_DATABASE } from '../data/cards';
import { getAccountByRiotId, getSummonerByPuuid, getTopMasteriesByPuuid, CHAMPION_ID_MAP, isApiKeyAvailable } from '../services/riotApi';

export default function DeckEditor() {
  const [searchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('q') || '';

  // Card Database State (using local Sets 1-3 CSV data)
  const [cardDatabase] = useState(CARDS_DATABASE);

  // Editor State
  const [selectedLegend, setSelectedLegend] = useState(null);
  const [mainDeck, setMainDeck] = useState([]); // Array of { card, count }
  const [runeDeck, setRuneDeck] = useState([]); // Array of { card, count }
  const [selectedBattlefields, setSelectedBattlefields] = useState([]); // Array of cards (max 3)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParamQuery);
  const [domainFilter, setDomainFilter] = useState('all');
  const [activePoolTab, setActivePoolTab] = useState('legends');
  const [activeCostFilter, setActiveCostFilter] = useState(null); // null or number (0-7)

  // Riot API Sync State
  const [riotId, setRiotId] = useState('');
  const [riotPlatform, setRiotPlatform] = useState('NA1');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [summonerProfile, setSummonerProfile] = useState(null);
  const [recommendedChampions, setRecommendedChampions] = useState([]);

  // Sync search parameters to searchQuery state when query param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Derived state: active domains allowed based on selected legend
  const allowedDomains = useMemo(() => {
    if (!selectedLegend) return ['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order', 'Colorless'];
    // Include Colorless by default as they are neutral
    return [...selectedLegend.domains, 'Colorless'];
  }, [selectedLegend]);

  // Sync Riot Profile and fetch masteries
  const handleRiotSync = async (e) => {
    e.preventDefault();
    if (!riotId.trim()) return;
    
    setSyncLoading(true);
    setSyncError(null);
    setRecommendedChampions([]);
    
    try {
      // 1. Resolve Riot ID to PUUID
      const accountData = await getAccountByRiotId(riotId, riotPlatform);
      const puuid = accountData.puuid;
      const gameName = accountData.gameName;
      const tagLine = accountData.tagLine;

      // 2. Fetch Summoner profile info
      const summonerData = await getSummonerByPuuid(puuid, riotPlatform);

      // 3. Fetch top Champion Masteries
      const masteries = await getTopMasteriesByPuuid(puuid, riotPlatform, 5);

      setSummonerProfile({
        name: `${gameName}#${tagLine}`,
        level: summonerData.summonerLevel,
        iconId: summonerData.profileIconId,
      });

      // 4. Map Champion Masteries to card recommendations using Tags
      const recs = masteries.map(m => {
        const mappedName = CHAMPION_ID_MAP[m.championId] || `Champion ID ${m.championId}`;
        // Find if this champion name matches any tag or legend name in database
        const rawName = mappedName.split(',')[0].trim(); // Get Garen, Yasuo, etc.
        return {
          championId: m.championId,
          name: rawName,
          points: m.championPoints
        };
      });
      setRecommendedChampions(recs);

    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to sync Riot account. Please check your Riot ID and Region.';
      if (err.message.includes('403')) {
        errorMsg = 'API Key is active but doesn\'t have permission for player sync.';
      } else if (err.message.includes('401')) {
        errorMsg = 'API Key is invalid or expired. Please update it in APIkey.txt.';
      }
      setSyncError(errorMsg);
    } finally {
      setSyncLoading(false);
    }
  };

  // Card interaction logic
  const handleCardClick = (card) => {
    const typeLower = (card.type || '').toLowerCase();
    
    if (typeLower === 'legend') {
      setSelectedLegend(card);
      // Auto-clear deck if it violates new legend domains
      const newAllowed = [...card.domains, 'Colorless'];
      setMainDeck(prev => prev.filter(item => item.card.domains.some(d => newAllowed.includes(d))));
      setRuneDeck(prev => prev.filter(item => item.card.domains.some(d => newAllowed.includes(d))));
    } else if (typeLower === 'battlefield') {
      setSelectedBattlefields(prev => {
        // Toggle selected battlefield
        const exists = prev.find(b => b.id === card.id);
        if (exists) {
          return prev.filter(b => b.id !== card.id);
        }
        if (prev.length >= 3) return prev; // max 3
        return [...prev, card];
      });
    } else if (typeLower === 'rune') {
      if (!selectedLegend) {
        alert('Please select a Legend first before adding Runes.');
        return;
      }
      const matchesLegend = card.domains.some(d => selectedLegend.domains.includes(d));
      if (!matchesLegend) {
        alert(`Cannot add "${card.name}". Runes must match your Legend's domains (${selectedLegend.domains.join('/')}).`);
        return;
      }
      setRuneDeck(prev => {
        const existing = prev.find(item => item.card.id === card.id);
        const currentTotal = prev.reduce((sum, item) => sum + item.count, 0);
        
        if (existing) {
          if (currentTotal >= 12 || existing.count >= 4) return prev;
          return prev.map(item => item.card.id === card.id ? { ...item, count: item.count + 1 } : item);
        } else {
          if (currentTotal >= 12) return prev;
          return [...prev, { card, count: 1 }];
        }
      });
    } else {
      // Main Deck cards: Unit, Spell, Gear
      if (!selectedLegend) {
        alert('Please select a Legend first before adding cards to the Main Deck.');
        return;
      }
      const matchesLegend = card.domains.some(d => allowedDomains.includes(d));
      if (!matchesLegend) {
        alert(`Cannot add "${card.name}". Cards must match your Legend's domains (${selectedLegend.domains.join('/')}).`);
        return;
      }
      setMainDeck(prev => {
        const existing = prev.find(item => item.card.id === card.id);
        const currentTotal = prev.reduce((sum, item) => sum + item.count, 0);

        if (existing) {
          if (currentTotal >= 40 || existing.count >= 3) return prev;
          return prev.map(item => item.card.id === card.id ? { ...item, count: item.count + 1 } : item);
        } else {
          if (currentTotal >= 40) return prev;
          return [...prev, { card, count: 1 }];
        }
      });
    }
  };

  const removeCardCount = (card) => {
    const typeLower = (card.type || '').toLowerCase();
    
    if (typeLower === 'rune') {
      setRuneDeck(prev => {
        const existing = prev.find(item => item.card.id === card.id);
        if (!existing) return prev;
        if (existing.count <= 1) {
          return prev.filter(item => item.card.id !== card.id);
        }
        return prev.map(item => item.card.id === card.id ? { ...item, count: item.count - 1 } : item);
      });
    } else {
      setMainDeck(prev => {
        const existing = prev.find(item => item.card.id === card.id);
        if (!existing) return prev;
        if (existing.count <= 1) {
          return prev.filter(item => item.card.id !== card.id);
        }
        return prev.map(item => item.card.id === card.id ? { ...item, count: item.count - 1 } : item);
      });
    }
  };

  const clearDeck = () => {
    setSelectedLegend(null);
    setMainDeck([]);
    setRuneDeck([]);
    setSelectedBattlefields([]);
  };

  // Load a dynamic sample deck matching a Legend
  const loadSampleDeck = () => {
    // 1. Choose Jinx (Fury/Chaos Legend)
    const legend = cardDatabase.legends.find(l => l.id === 'ogn-251') || cardDatabase.legends[0];
    setSelectedLegend(legend);

    // 2. Set up Main Deck (40 cards total)
    const allowed = legend.domains;
    const legalMainCards = cardDatabase.mainDeck.filter(m => m.domains.some(d => allowed.includes(d)));
    const deck = [];
    let total = 0;
    
    for (const card of legalMainCards) {
      if (total >= 40) break;
      const count = Math.min(3, 40 - total);
      deck.push({ card, count });
      total += count;
    }
    setMainDeck(deck);

    // 3. Set up Rune Deck (12 runes)
    const legalRunes = cardDatabase.runes.filter(r => r.domains.some(d => allowed.includes(d)));
    const runes = [];
    let runeTotal = 0;
    
    for (const rune of legalRunes) {
      if (runeTotal >= 12) break;
      const count = Math.min(4, 12 - runeTotal);
      runes.push({ card: rune, count });
      runeTotal += count;
    }
    setRuneDeck(runes);

    // 4. Battlefields (3 battlefields)
    setSelectedBattlefields(cardDatabase.battlefields.slice(0, 3));
  };

  // Filtered card pool based on search, cost, active tab, and domain filter
  const filteredCardPool = useMemo(() => {
    console.log('--- FILTERING CARD POOL ---');
    console.log('activePoolTab:', activePoolTab);
    console.log('cardDatabase keys:', Object.keys(cardDatabase || {}));
    console.log('cardDatabase.legends length:', cardDatabase?.legends?.length);
    console.log('cardDatabase.mainDeck length:', cardDatabase?.mainDeck?.length);
    
    let pool = [];
    if (activePoolTab === 'legends') pool = cardDatabase.legends;
    else if (activePoolTab === 'runes') pool = cardDatabase.runes;
    else if (activePoolTab === 'main') pool = cardDatabase.mainDeck;
    else if (activePoolTab === 'battlefields') pool = cardDatabase.battlefields;

    console.log('Selected pool size before filters:', pool?.length);
    if (pool && pool.length > 0) {
      console.log('Sample types in selected pool:', Array.from(new Set(pool.map(c => c.type))));
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      pool = pool.filter(card => 
        card.name.toLowerCase().includes(query) || 
        card.text.toLowerCase().includes(query) ||
        (card.tags && card.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    // Domain filter
    if (domainFilter !== 'all') {
      pool = pool.filter(card => card.domains && card.domains.includes(domainFilter));
    }

    // Cost filter
    if (activeCostFilter !== null) {
      pool = pool.filter(card => {
        if (typeof card.cost !== 'number') return false;
        if (activeCostFilter === 7) return card.cost >= 7;
        return card.cost === activeCostFilter;
      });
    }

    return pool;
  }, [activePoolTab, searchQuery, domainFilter, activeCostFilter, cardDatabase]);

  // Deck metrics calculations
  const mainDeckTotal = useMemo(() => mainDeck.reduce((sum, item) => sum + item.count, 0), [mainDeck]);
  const runeDeckTotal = useMemo(() => runeDeck.reduce((sum, item) => sum + item.count, 0), [runeDeck]);
  
  // Real-time Mana Curve Calculations
  const manaCurveData = useMemo(() => {
    const curve = Array(8).fill(0); // index 0-7 represents cost 0-7+
    mainDeck.forEach(item => {
      const cost = item.card.cost;
      if (typeof cost === 'number') {
        const index = Math.min(cost, 7);
        curve[index] += item.count;
      }
    });
    return curve;
  }, [mainDeck]);

  const maxCurveCount = useMemo(() => Math.max(...manaCurveData, 1), [manaCurveData]);

  // Rules validation engine
  const validationResults = useMemo(() => {
    const checks = {
      legend: { ok: false, msg: 'No Legend selected (Exactly 1 required)' },
      mainSize: { ok: false, msg: `Main deck has ${mainDeckTotal}/40 cards` },
      runeSize: { ok: false, msg: `Rune deck has ${runeDeckTotal}/12 runes` },
      battlefieldSize: { ok: false, msg: `Selected ${selectedBattlefields.length}/3 battlefields` },
      domainLegal: { ok: true, msg: 'All cards match Legend domains' },
      errors: []
    };

    // Legend check
    if (selectedLegend) {
      checks.legend = { ok: true, msg: `Legend: ${selectedLegend.name}` };
    } else {
      checks.errors.push('Choose a Legend card from the gallery.');
    }

    // Main Deck size check
    if (mainDeckTotal === 40) {
      checks.mainSize = { ok: true, msg: 'Main deck size is correct (40 cards)' };
    } else {
      checks.errors.push(`Main deck must contain exactly 40 cards (currently ${mainDeckTotal}).`);
    }

    // Rune Deck size check
    if (runeDeckTotal === 12) {
      checks.runeSize = { ok: true, msg: 'Rune deck size is correct (12 runes)' };
    } else {
      checks.errors.push(`Rune deck must contain exactly 12 runes (currently ${runeDeckTotal}).`);
    }

    // Battlefield check
    if (selectedBattlefields.length === 3) {
      checks.battlefieldSize = { ok: true, msg: 'Battlefields selected correctly (3 cards)' };
    } else {
      checks.errors.push(`You must select exactly 3 battlefields (currently ${selectedBattlefields.length}).`);
    }

    // Domain validation check
    if (selectedLegend) {
      const allowed = allowedDomains;
      const illegalMain = mainDeck.filter(item => !item.card.domains.some(d => allowed.includes(d)));
      const illegalRunes = runeDeck.filter(item => !item.card.domains.some(d => allowed.includes(d)));

      if (illegalMain.length > 0 || illegalRunes.length > 0) {
        checks.domainLegal = { ok: false, msg: 'Contains cards outside Legend domains' };
        
        illegalMain.forEach(item => {
          checks.errors.push(`Main deck card "${item.card.name}" is illegal (Domain: ${item.card.domains.join('/')}).`);
        });
        illegalRunes.forEach(item => {
          checks.errors.push(`Rune card "${item.card.name}" is illegal (Domain: ${item.card.domains.join('/')}).`);
        });
      }
    }

    return checks;
  }, [selectedLegend, mainDeck, runeDeck, selectedBattlefields, mainDeckTotal, runeDeckTotal, allowedDomains]);

  // Export decklist to clipboard
  const exportDeck = () => {
    if (!selectedLegend) {
      alert('Please select a Legend before exporting.');
      return;
    }

    let text = `=== RIFTBOUND TCG DECKLIST ===\n`;
    text += `Legend: ${selectedLegend.name} (${selectedLegend.domains.join('/')})\n\n`;
    
    text += `--- BATTLEFIELDS (3) ---\n`;
    selectedBattlefields.forEach(b => {
      text += `1x ${b.name}\n`;
    });
    
    text += `\n--- RUNE DECK (12) ---\n`;
    runeDeck.forEach(item => {
      text += `${item.count}x ${item.card.name}\n`;
    });

    text += `\n--- MAIN DECK (40) ---\n`;
    mainDeck.forEach(item => {
      text += `${item.count}x ${item.card.name} (Cost: ${item.card.cost})\n`;
    });

    navigator.clipboard.writeText(text)
      .then(() => alert('Decklist successfully copied to clipboard!'))
      .catch(() => alert('Failed to copy decklist. Please select and copy manually.'));
  };

  // Helper to determine CSS classes for card types & domains
  const getDomainColorClass = (domains) => {
    if (!domains || domains.length === 0) return 'colorless';
    return domains[0].toLowerCase(); // e.g. fury, calm, mind, body, chaos, order, colorless
  };

  return (
    <Container fluid className="p-0 text-light">
      <div className="deck-builder-layout">
        
        {/* LEFT COLUMN: Card Gallery */}
        <div className="deck-builder-gallery">
          <Row className="mb-3 align-items-center">
            <Col md={7}>
              <div className="d-flex align-items-center gap-2">
                <h1 className="fs-3 fw-bold text-gold m-0 text-glow">Card Library</h1>
                <Badge bg="secondary" className="px-2 py-1 bg-domain-colorless">
                  📚 Offline DB (Sets 1-3)
                </Badge>
              </div>
              <p className="text-muted m-0 text-xs">Browse the card collection and click cards to add them to your deck</p>
            </Col>
            
            <Col md={5} className="text-md-end mt-2 mt-md-0 d-flex gap-2 justify-content-md-end">
              <Button variant="outline-danger" size="sm" onClick={clearDeck}>
                🗑️ Clear
              </Button>
              <Button variant="outline-warning" size="sm" onClick={loadSampleDeck}>
                🧪 Sample Deck
              </Button>
              <Button variant="cyan" size="sm" onClick={exportDeck} disabled={!selectedLegend}>
                📋 Export List
              </Button>
            </Col>
          </Row>

          {/* ADVANCED FILTERING PANEL */}
          <Card className="card-glass border-secondary-subtle p-3 mb-4">
            <Row className="g-3 align-items-center">
              
              {/* Search input */}
              <Col lg={4}>
                <InputGroup size="sm" className="rounded overflow-hidden">
                  <InputGroup.Text className="bg-dark border-secondary text-muted">🔍</InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search name, text, tags..."
                    className="bg-dark border-secondary text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button variant="dark" className="border-secondary text-muted" onClick={() => setSearchQuery('')}>
                      ✕
                    </Button>
                  )}
                </InputGroup>
              </Col>

              {/* Card Type Filter Tabs */}
              <Col lg={8} className="d-flex justify-content-lg-end">
                <div className="d-flex gap-2">
                  <div 
                    className={`nav-tab-custom py-1 px-3 fs-7 cursor-pointer transition-all ${activePoolTab === 'legends' ? 'active' : ''}`}
                    onClick={() => setActivePoolTab('legends')}
                  >
                    Legends
                  </div>
                  <div 
                    className={`nav-tab-custom py-1 px-3 fs-7 cursor-pointer transition-all ${activePoolTab === 'main' ? 'active' : ''}`}
                    onClick={() => setActivePoolTab('main')}
                  >
                    Main Deck
                  </div>
                  <div 
                    className={`nav-tab-custom py-1 px-3 fs-7 cursor-pointer transition-all ${activePoolTab === 'runes' ? 'active' : ''}`}
                    onClick={() => setActivePoolTab('runes')}
                  >
                    Runes
                  </div>
                  <div 
                    className={`nav-tab-custom py-1 px-3 fs-7 cursor-pointer transition-all ${activePoolTab === 'battlefields' ? 'active' : ''}`}
                    onClick={() => setActivePoolTab('battlefields')}
                  >
                    Battlefields
                  </div>
                </div>
              </Col>
            </Row>

            <hr className="my-2 border-secondary" style={{ opacity: 0.15 }} />

            <Row className="g-3 align-items-center">
              {/* Domain Pill Selectors */}
              <Col md={7}>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="text-muted text-xs font-semibold uppercase me-1">Domains:</span>
                  <div 
                    className={`domain-pill ${domainFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDomainFilter('all')}
                  >
                    All
                  </div>
                  {['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order', 'Colorless'].map(domain => (
                    <div
                      key={domain}
                      className={`domain-pill ${domainFilter === domain ? `active active-${domain.toLowerCase()}` : ''}`}
                      onClick={() => setDomainFilter(domain)}
                    >
                      {domain}
                    </div>
                  ))}
                </div>
              </Col>

              {/* Mana cost gem toggles */}
              <Col md={5} className="d-flex justify-content-md-end">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted text-xs font-semibold uppercase me-1">Cost:</span>
                  <div className="mana-gem-container">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(cost => (
                      <div
                        key={cost}
                        className={`mana-gem-btn ${activeCostFilter === cost ? 'active' : ''}`}
                        onClick={() => setActiveCostFilter(activeCostFilter === cost ? null : cost)}
                      >
                        {cost === 7 ? '7+' : cost}
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* CARD GRID */}
          {filteredCardPool.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="fs-5">No cards found matching your active filters.</p>
              <Button size="sm" variant="outline-gold" onClick={() => { setSearchQuery(''); setDomainFilter('all'); setActiveCostFilter(null); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 card-pool-scroll">
              {filteredCardPool.map((card, index) => {
                const domColor = getDomainColorClass(card.domains);
                const isSelectedInDeck = (card.type === 'Legend' && selectedLegend?.id === card.id) ||
                                         (card.type === 'Battlefield' && selectedBattlefields.some(b => b.id === card.id));
                                         
                // Check if this card is recommended based on Riot Sync
                const isRecommended = recommendedChampions.some(rec => 
                  card.name.toLowerCase().includes(rec.name.toLowerCase()) || 
                  (card.tags && card.tags.some(tag => tag.toLowerCase() === rec.name.toLowerCase()))
                );

                // Grey out cards that don't match the selected Legend's allowed domains (only applies to runes and main deck cards)
                const isInvalid = selectedLegend && 
                                  card.type !== 'Legend' && 
                                  card.type !== 'Battlefield' && 
                                  !card.domains.some(d => allowedDomains.includes(d));

                return (
                  <Col key={`${card.id}-${index}`}>
                    <Card 
                      className={`card-tcg cursor-pointer border border-2 border-domain-${domColor} ${isSelectedInDeck ? 'border-glow' : ''} ${isInvalid ? 'opacity-50' : ''}`}
                      onClick={() => !isInvalid && handleCardClick(card)}
                      style={isInvalid ? { cursor: 'not-allowed' } : {}}
                    >
                      {card.image ? (
                        <Card.Img 
                          variant="top" 
                          src={card.image} 
                          alt={card.name} 
                          loading="lazy" 
                          className="w-100 h-100 object-fit-contain"
                        />
                      ) : (
                        <Card.Body className="p-3 d-flex flex-column justify-content-center align-items-center h-100 bg-dark text-center">
                          <Card.Title className="fs-6 fw-bold mb-1 text-white">{card.name}</Card.Title>
                          <span className="badge bg-secondary text-xs mb-2">{card.type}</span>
                          <Card.Text className="card-text-custom text-muted mb-0">{card.text}</Card.Text>
                        </Card.Body>
                      )}

                      {/* Recommendation indicator */}
                      {isRecommended && (
                        <div className="position-absolute bottom-0 start-0 w-100 bg-gold text-dark py-1 text-center font-bold text-xxs" style={{ letterSpacing: '1px', opacity: 0.9, zIndex: 3 }}>
                          ★ RECOMMENDED
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Deck Drawer */}
        <div className="deck-builder-sidebar">
          
          <div className="p-3 border-bottom border-secondary" style={{ backgroundColor: 'rgba(5, 6, 8, 0.5)' }}>
            <h2 className="fs-5 fw-bold m-0 text-gold text-glow">Active Deck</h2>
            <div className="d-flex justify-content-between text-muted text-xs mt-1">
              <span>Main: {mainDeckTotal}/40</span>
              <span>Runes: {runeDeckTotal}/12</span>
              <span>Battlefields: {selectedBattlefields.length}/3</span>
            </div>
          </div>

          <div className="sidebar-scroll">
            
            {/* Legend Slot */}
            <div className="slot-header">👑 Legend Card</div>
            {selectedLegend ? (
              <div 
                className="deck-strip filled mb-3 border-domain-gold" 
                onClick={() => setSelectedLegend(null)}
              >
                <div className="deck-strip-art" style={{ backgroundImage: `url(${selectedLegend.image})` }} />
                <div className="deck-strip-cost bg-warning text-dark">L</div>
                <div className="deck-strip-name">{selectedLegend.name}</div>
                <div className="deck-strip-count">Remove</div>
              </div>
            ) : (
              <div className="legend-slot mb-3 text-muted text-xs">
                Select a Legend from the gallery
              </div>
            )}

            {/* Battlefields Slots */}
            <div className="slot-header">🏔️ Battlefields (Max 3)</div>
            {selectedBattlefields.length > 0 ? (
              <div className="mb-3">
                {selectedBattlefields.map((b, index) => (
                  <div 
                    key={`${b.id}-${index}`} 
                    className="deck-strip filled mb-1" 
                    onClick={() => handleCardClick(b)}
                  >
                    <div className="deck-strip-art" style={{ backgroundImage: `url(${b.image})` }} />
                    <div className="deck-strip-cost bg-success">B</div>
                    <div className="deck-strip-name">{b.name}</div>
                    <div className="deck-strip-count">Remove</div>
                  </div>
                ))}
                {selectedBattlefields.length < 3 && (
                  <div className="text-muted text-xs italic text-center mt-1">
                    Needs {3 - selectedBattlefields.length} more battlefield(s)
                  </div>
                )}
              </div>
            ) : (
              <div className="champion-slot mb-3 text-muted text-xs">
                Select 3 Battlefields
              </div>
            )}

            {/* Rune Deck List */}
            <div className="slot-header d-flex justify-content-between align-items-center">
              <span>💎 Rune Deck ({runeDeckTotal}/12)</span>
            </div>
            {runeDeck.length > 0 ? (
              <div className="mb-3">
                {runeDeck.map((item, index) => (
                  <div 
                    key={`${item.card.id}-${index}`} 
                    className="deck-strip" 
                    onClick={() => removeCardCount(item.card)}
                  >
                    <div className="deck-strip-art" style={{ backgroundImage: `url(${item.card.image})` }} />
                    <div className="deck-strip-cost bg-primary">R</div>
                    <div className="deck-strip-name">{item.card.name}</div>
                    <div className="deck-strip-count">x{item.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-xs text-center py-2 mb-3 bg-dark rounded border border-secondary border-dashed" style={{ borderStyle: 'dashed' }}>
                No runes added yet
              </div>
            )}

            {/* Main Deck List */}
            <div className="slot-header d-flex justify-content-between align-items-center">
              <span>⚔️ Main Deck ({mainDeckTotal}/40)</span>
            </div>
            {mainDeck.length > 0 ? (
              <div className="mb-3">
                {mainDeck.map((item, index) => {
                  const domColor = getDomainColorClass(item.card.domains);
                  return (
                    <div 
                      key={`${item.card.id}-${index}`} 
                      className="deck-strip" 
                      onClick={() => removeCardCount(item.card)}
                    >
                      <div className="deck-strip-art" style={{ backgroundImage: `url(${item.card.image})` }} />
                      <div className={`deck-strip-cost bg-domain-${domColor}`}>
                        {item.card.cost}
                      </div>
                      <div className="deck-strip-name">{item.card.name}</div>
                      <div className="deck-strip-count">x{item.count}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted text-xs text-center py-3 bg-dark rounded border border-secondary" style={{ borderStyle: 'dashed' }}>
                Empty Main Deck
              </div>
            )}

            {/* LIVE MANA CURVE */}
            <div className="slot-header">📊 Mana Curve</div>
            <div className="mana-curve-chart mb-3">
              {manaCurveData.map((count, index) => {
                const heightPercent = count > 0 ? (count / maxCurveCount) * 44 + 4 : 2; // scale height
                return (
                  <div key={index} className="mana-curve-bar-container" title={`${count} cards of cost ${index === 7 ? '7+' : index}`}>
                    <div className="mana-curve-bar" style={{ height: `${heightPercent}px` }} />
                    <div className="mana-curve-label">{index === 7 ? '7+' : index}</div>
                  </div>
                );
              })}
            </div>

            {/* VALIDATION CHECKLIST */}
            <div className="slot-header">🚨 Rules Check</div>
            <Card className="bg-dark p-2 border-secondary mb-3">
              <div className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center justify-content-between text-xs">
                  <span>Legend Selected:</span>
                  <span className={validationResults.legend.ok ? 'text-success' : 'text-danger'}>
                    {validationResults.legend.ok ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs">
                  <span>Main Deck Count (40):</span>
                  <span className={validationResults.mainSize.ok ? 'text-success' : 'text-danger'}>
                    {validationResults.mainSize.ok ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs">
                  <span>Rune Deck Count (12):</span>
                  <span className={validationResults.runeSize.ok ? 'text-success' : 'text-danger'}>
                    {validationResults.runeSize.ok ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs">
                  <span>Battlefields Selected (3):</span>
                  <span className={validationResults.battlefieldSize.ok ? 'text-success' : 'text-danger'}>
                    {validationResults.battlefieldSize.ok ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between text-xs">
                  <span>Domain Colors Check:</span>
                  <span className={validationResults.domainLegal.ok ? 'text-success' : 'text-danger'}>
                    {validationResults.domainLegal.ok ? '✓ Legal' : '✗ Illegal Cards'}
                  </span>
                </div>
              </div>

              {validationResults.errors.length > 0 && (
                <div className="mt-2 p-1 bg-danger-subtle text-danger rounded border border-danger-subtle text-xs" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {validationResults.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </Card>

            {/* RIOT PROFILE SYNC FOR MASTERIES */}
            <div className="slot-header">🔗 Riot Profile Sync</div>
            <Card className="bg-dark p-2 border-secondary">
              {isApiKeyAvailable() ? (
                <Form onSubmit={handleRiotSync}>
                  <p className="text-muted text-xs mb-2">Sync your profile to highlight cards matching your masteries.</p>
                  
                  <InputGroup size="sm" className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Name#TAG (e.g. Brand#NA1)"
                      className="bg-transparent text-white border-secondary"
                      value={riotId}
                      onChange={(e) => setRiotId(e.target.value)}
                    />
                    <Form.Select 
                      size="sm"
                      className="bg-dark text-white border-secondary" 
                      style={{ maxWidth: '85px' }}
                      value={riotPlatform}
                      onChange={(e) => setRiotPlatform(e.target.value)}
                    >
                      <option value="NA1">NA</option>
                      <option value="EUW1">EUW</option>
                      <option value="EUN1">EUNE</option>
                      <option value="KR">KR</option>
                      <option value="JP1">JP</option>
                      <option value="OC1">OCE</option>
                    </Form.Select>
                  </InputGroup>
                  
                  <Button 
                    type="submit" 
                    variant="outline-cyan" 
                    size="sm" 
                    className="w-100" 
                    disabled={syncLoading}
                  >
                    {syncLoading ? 'Syncing...' : 'Sync Masteries'}
                  </Button>

                  {syncError && (
                    <div className="text-danger text-xs mt-2">{syncError}</div>
                  )}

                  {summonerProfile && (
                    <div className="mt-2 text-xs border-top border-secondary pt-2">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="font-bold text-cyan">{summonerProfile.name}</span>
                        <span className="text-muted">Lv {summonerProfile.level}</span>
                      </div>
                      
                      {recommendedChampions.length > 0 && (
                        <div className="mt-1">
                          <div className="text-gold font-bold">Main Recommendations:</div>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {recommendedChampions.map(rec => (
                              <Badge key={rec.name} bg="dark" className="border border-gold text-gold">
                                {rec.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Form>
              ) : (
                <div className="text-muted text-xs text-center py-2">
                  Riot API integration disabled (No local API Key found).
                </div>
              )}
            </Card>
          </div>
        </div>

      </div>
    </Container>
  );
}
