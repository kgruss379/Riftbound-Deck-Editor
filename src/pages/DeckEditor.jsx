import React, { useState, useMemo, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Tab, Nav, Alert, Modal, InputGroup, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { CARDS_DATABASE } from '../data/cards';
import { getAccountByRiotId, getSummonerByPuuid, getTopMasteriesByPuuid, CHAMPION_ID_MAP, isApiKeyAvailable } from '../services/riotApi';

export default function DeckEditor() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const [searchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('q') || '';

  // Card Database State (using local Sets 1-3 CSV data)
  const [cardDatabase] = useState(CARDS_DATABASE);

  // Editor State
  const [selectedLegend, setSelectedLegend] = useState(null);
  const [mainDeck, setMainDeck] = useState([]); // Array of { card, count }
  const [runeDeck, setRuneDeck] = useState([]); // Array of { card, count }
  const [selectedBattlefields, setSelectedBattlefields] = useState([]); // Array of cards (max 3)
  
  // Search & Advanced Filter State
  const [searchQuery, setSearchQuery] = useState(searchParamQuery);
  const [domainFilter, setDomainFilter] = useState('all');
  const [subTypeFilter, setSubTypeFilter] = useState('all'); // all, unit, spell, gear
  const [rarityFilter, setRarityFilter] = useState('all'); // all, common, rare, epic, showcase
  const [activePoolTab, setActivePoolTab] = useState('legends');
  const [activeCostFilter, setActiveCostFilter] = useState(null); // null or number (0-7)

  // UX Feature States: Inspector Lightbox, Text Importer, & Toasts
  const [inspectedCard, setInspectedCard] = useState(null);
  const [importTextModalOpen, setImportTextModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [toastState, setToastState] = useState({ show: false, message: '', variant: 'success' });

  // Publish / Share to Community Modal States
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDesc, setPublishDesc] = useState('');
  const [publishVersionName, setPublishVersionName] = useState('v1');
  const [publishSuccessMsg, setPublishSuccessMsg] = useState('');

  // Helper trigger for non-intrusive Toast messages
  const triggerToast = (message, variant = 'success') => {
    setToastState({ show: true, message, variant });
  };

  // Riot API Sync State
  const [riotId, setRiotId] = useState('');
  const [riotPlatform, setRiotPlatform] = useState('NA1');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [summonerProfile, setSummonerProfile] = useState(null);
  const [recommendedChampions, setRecommendedChampions] = useState([]);

  // Check for imported community deck payload on mount
  useEffect(() => {
    const rawImport = localStorage.getItem('riftbound_import_deck');
    if (rawImport) {
      try {
        const parsed = JSON.parse(rawImport);
        if (parsed && parsed.deck) {
          const leg = CARDS_DATABASE.legends.find(l => l.id === parsed.deck.legendId);
          if (leg) setSelectedLegend(leg);

          const bfs = (parsed.deck.battlefieldIds || []).map(bId => 
            CARDS_DATABASE.battlefields.find(b => b.id === bId)
          ).filter(Boolean);
          setSelectedBattlefields(bfs);

          const rDeck = (parsed.deck.runeDeck || []).map(item => ({
            card: CARDS_DATABASE.runes.find(r => r.id === item.cardId),
            count: item.count
          })).filter(item => item.card);
          setRuneDeck(rDeck);

          const mDeck = (parsed.deck.mainDeck || []).map(item => ({
            card: CARDS_DATABASE.mainDeck.find(m => m.id === item.cardId),
            count: item.count
          })).filter(item => item.card);
          setMainDeck(mDeck);

          if (parsed.title) {
            setPublishTitle(parsed.title);
          }
        }
      } catch (e) {
        console.error("Failed to parse imported deck", e);
      } finally {
        localStorage.removeItem('riftbound_import_deck');
      }
    }
  }, []);

  // Sync search parameters to searchQuery state and select Legend from URL parameters
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
    
    const legendId = searchParams.get('legend');
    if (legendId) {
      const found = cardDatabase.legends.find(l => l.id === legendId);
      if (found) {
        setSelectedLegend(found);
      }
    }
  }, [searchParams, cardDatabase]);

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
      triggerToast(`Selected Legend: ${card.name}`, 'success');
    } else if (typeLower === 'battlefield') {
      setSelectedBattlefields(prev => {
        // Toggle selected battlefield
        const exists = prev.find(b => b.id === card.id);
        if (exists) {
          triggerToast(`Removed Battlefield: ${card.name}`, 'info');
          return prev.filter(b => b.id !== card.id);
        }
        if (prev.length >= 3) {
          triggerToast('Maximum 3 Battlefields allowed', 'warning');
          return prev;
        }
        triggerToast(`Added Battlefield: ${card.name}`, 'success');
        return [...prev, card];
      });
    } else if (typeLower === 'rune') {
      if (!selectedLegend) {
        triggerToast('Select a Legend first before adding Runes', 'warning');
        return;
      }
      const matchesLegend = card.domains.some(d => selectedLegend.domains.includes(d));
      if (!matchesLegend) {
        triggerToast(`Rune domain (${card.domains.join('/')}) does not match Legend`, 'danger');
        return;
      }
      setRuneDeck(prev => {
        const existing = prev.find(item => item.card.id === card.id);
        const currentTotal = prev.reduce((sum, item) => sum + item.count, 0);
        
        if (existing) {
          if (currentTotal >= 12 || existing.count >= 4) {
            triggerToast('Rune deck limit reached', 'warning');
            return prev;
          }
          triggerToast(`Added ${card.name} (${existing.count + 1})`, 'success');
          return prev.map(item => item.card.id === card.id ? { ...item, count: item.count + 1 } : item);
        } else {
          if (currentTotal >= 12) {
            triggerToast('Rune deck capacity full (12/12)', 'warning');
            return prev;
          }
          triggerToast(`Added ${card.name}`, 'success');
          return [...prev, { card, count: 1 }];
        }
      });
    } else {
      // Main Deck cards: Unit, Spell, Gear
      if (!selectedLegend) {
        triggerToast('Select a Legend first before adding Main Deck cards', 'warning');
        return;
      }
      const matchesLegend = card.domains.some(d => allowedDomains.includes(d));
      if (!matchesLegend) {
        triggerToast(`Card domain (${card.domains.join('/')}) outside Legend domains`, 'danger');
        return;
      }
      setMainDeck(prev => {
        const existing = prev.find(item => item.card.id === card.id);
        const currentTotal = prev.reduce((sum, item) => sum + item.count, 0);

        if (existing) {
          if (currentTotal >= 40 || existing.count >= 3) {
            triggerToast(existing.count >= 3 ? 'Max 3 copies per card' : 'Main deck capacity full (40/40)', 'warning');
            return prev;
          }
          triggerToast(`Added ${card.name} (${existing.count + 1})`, 'success');
          return prev.map(item => item.card.id === card.id ? { ...item, count: item.count + 1 } : item);
        } else {
          if (currentTotal >= 40) {
            triggerToast('Main deck capacity full (40/40)', 'warning');
            return prev;
          }
          triggerToast(`Added ${card.name}`, 'success');
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
    triggerToast('Cleared active deck build', 'info');
  };

  // Load a dynamic sample deck matching a Legend
  const loadSampleDeck = () => {
    const legend = cardDatabase.legends.find(l => l.id === 'ogn-251') || cardDatabase.legends[0];
    setSelectedLegend(legend);

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
    setSelectedBattlefields(cardDatabase.battlefields.slice(0, 3));

    triggerToast('Loaded sample Kai\'Sa Void Surge deck!', 'success');
  };

  // Handle Text Deck Import
  const handleImportTextList = (e) => {
    e.preventDefault();
    if (!importRawText.trim()) return;

    const lines = importRawText.split('\n');
    let addedCount = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('===') || trimmed.startsWith('---')) return;

      const match = trimmed.match(/^(\d+)\s*x?\s+(.+)$/i) || trimmed.match(/^x?(\d+)\s+(.+)$/i);
      let count = 1;
      let nameStr = trimmed;

      if (match) {
        count = parseInt(match[1], 10);
        nameStr = match[2].replace(/\(Cost:.*?\)/i, '').trim();
      }

      const foundLegend = CARDS_DATABASE.legends.find(c => c.name.toLowerCase() === nameStr.toLowerCase() || c.name.toLowerCase().includes(nameStr.toLowerCase()));
      if (foundLegend && !selectedLegend) {
        setSelectedLegend(foundLegend);
        addedCount++;
        return;
      }

      const foundRune = CARDS_DATABASE.runes.find(c => c.name.toLowerCase() === nameStr.toLowerCase());
      if (foundRune) {
        setRuneDeck(prev => {
          const existing = prev.find(i => i.card.id === foundRune.id);
          if (existing) return prev.map(i => i.card.id === foundRune.id ? { ...i, count: Math.min(i.count + count, 12) } : i);
          return [...prev, { card: foundRune, count: Math.min(count, 12) }];
        });
        addedCount++;
        return;
      }

      const foundBattlefield = CARDS_DATABASE.battlefields.find(c => c.name.toLowerCase() === nameStr.toLowerCase());
      if (foundBattlefield) {
        setSelectedBattlefields(prev => {
          if (prev.find(b => b.id === foundBattlefield.id)) return prev;
          if (prev.length >= 3) return prev;
          return [...prev, foundBattlefield];
        });
        addedCount++;
        return;
      }

      const foundMain = CARDS_DATABASE.mainDeck.find(c => c.name.toLowerCase() === nameStr.toLowerCase() || c.name.toLowerCase().includes(nameStr.toLowerCase()));
      if (foundMain) {
        setMainDeck(prev => {
          const existing = prev.find(i => i.card.id === foundMain.id);
          if (existing) return prev.map(i => i.card.id === foundMain.id ? { ...i, count: Math.min(i.count + count, 3) } : i);
          return [...prev, { card: foundMain, count: Math.min(count, 3) }];
        });
        addedCount++;
      }
    });

    setImportTextModalOpen(false);
    setImportRawText('');
    triggerToast(`Successfully imported ${addedCount} card entries into editor!`, 'success');
  };

  // Helper to resolve card energy cost (defaults to 0 if undefined for spells/gear)
  const getCardCost = (card) => {
    if (!card) return 0;
    if (typeof card.cost === 'number') return card.cost;
    if (typeof card.energy === 'number') return card.energy;
    return 0;
  };

  // Filtered card pool based on search, cost, active tab, sub-type, rarity, and domain filter
  const filteredCardPool = useMemo(() => {
    let pool = [];
    if (activePoolTab === 'legends') pool = cardDatabase.legends;
    else if (activePoolTab === 'runes') pool = cardDatabase.runes;
    else if (activePoolTab === 'main') pool = cardDatabase.mainDeck;
    else if (activePoolTab === 'battlefields') pool = cardDatabase.battlefields;

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

    // Sub-Type filter (for Main Deck tab)
    if (activePoolTab === 'main' && subTypeFilter !== 'all') {
      pool = pool.filter(card => card.type && card.type.toLowerCase() === subTypeFilter.toLowerCase());
    }

    // Rarity filter
    if (rarityFilter !== 'all') {
      pool = pool.filter(card => card.rarity && card.rarity.toLowerCase() === rarityFilter.toLowerCase());
    }

    // Cost filter
    if (activeCostFilter !== null) {
      pool = pool.filter(card => {
        const cost = getCardCost(card);
        if (activeCostFilter === 7) return cost >= 7;
        return cost === activeCostFilter;
      });
    }

    return pool;
  }, [activePoolTab, searchQuery, domainFilter, subTypeFilter, rarityFilter, activeCostFilter, cardDatabase]);

  // Deck metrics calculations
  const mainDeckTotal = useMemo(() => mainDeck.reduce((sum, item) => sum + item.count, 0), [mainDeck]);
  const runeDeckTotal = useMemo(() => runeDeck.reduce((sum, item) => sum + item.count, 0), [runeDeck]);
  
  // Composition & Analytics Metrics
  const deckComposition = useMemo(() => {
    let units = 0;
    let spells = 0;
    let gear = 0;
    let totalCost = 0;
    let countCostCards = 0;

    mainDeck.forEach(item => {
      const typeLower = (item.card.type || '').toLowerCase();
      if (typeLower === 'unit') units += item.count;
      else if (typeLower === 'spell') spells += item.count;
      else if (typeLower === 'gear') gear += item.count;

      const cost = getCardCost(item.card);
      totalCost += (cost * item.count);
      countCostCards += item.count;
    });

    const avgCost = countCostCards > 0 ? (totalCost / countCostCards).toFixed(1) : '0.0';

    return { units, spells, gear, avgCost };
  }, [mainDeck]);

  const overallCompletionPercent = useMemo(() => {
    const isLegend = selectedLegend ? 1 : 0;
    const bfs = Math.min(selectedBattlefields.length, 3);
    const runes = Math.min(runeDeckTotal, 12);
    const main = Math.min(mainDeckTotal, 40);

    const totalPoints = isLegend + bfs + runes + main; // out of 56 total
    return Math.round((totalPoints / 56) * 100);
  }, [selectedLegend, selectedBattlefields, runeDeckTotal, mainDeckTotal]);
  
  // Real-time Mana Curve Calculations
  const manaCurveData = useMemo(() => {
    const curve = Array(8).fill(0); // index 0-7 represents cost 0-7+
    mainDeck.forEach(item => {
      const cost = getCardCost(item.card);
      const index = Math.min(cost, 7);
      curve[index] += item.count;
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
      triggerToast('Please select a Legend before exporting.', 'warning');
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
      .then(() => triggerToast('Decklist successfully copied to clipboard!', 'success'))
      .catch(() => triggerToast('Failed to copy decklist to clipboard.', 'danger'));
  };

  // Helper to determine CSS classes for card types & domains
  const getDomainColorClass = (domains) => {
    if (!domains || domains.length === 0) return 'colorless';
    return domains[0].toLowerCase(); // e.g. fury, calm, mind, body, chaos, order, colorless
  };

  // Publish / Share Deck to Community (with auto-versioning)
  const handlePublishDeck = (e) => {
    e.preventDefault();
    if (!selectedLegend || !publishTitle.trim()) return;

    const author = outletContext?.username || localStorage.getItem('riftbound_username') || 'Guest';
    const rawDecks = localStorage.getItem('riftbound_community_decks');
    let communityDecks = rawDecks ? JSON.parse(rawDecks) : [];

    const deckSnapshot = {
      legendId: selectedLegend.id,
      battlefieldIds: selectedBattlefields.map(b => b.id),
      runeDeck: runeDeck.map(r => ({ cardId: r.card.id, count: r.count })),
      mainDeck: mainDeck.map(m => ({ cardId: m.card.id, count: m.count }))
    };

    // Find existing deck by this author with matching title
    const existingIdx = communityDecks.findIndex(
      d => d.author.toLowerCase() === author.toLowerCase() && d.title.toLowerCase() === publishTitle.trim().toLowerCase()
    );

    const versionObj = {
      versionName: publishVersionName.trim() || `v${existingIdx >= 0 ? communityDecks[existingIdx].versions.length + 1 : 1}`,
      changeLog: publishDesc.trim() || 'Updated deck build.',
      timestamp: new Date().toISOString(),
      deck: deckSnapshot
    };

    if (existingIdx >= 0) {
      // Append version to existing post
      communityDecks[existingIdx].description = publishDesc.trim() || communityDecks[existingIdx].description;
      communityDecks[existingIdx].versions.unshift(versionObj); // latest version first
    } else {
      // Create new deck post
      const newPost = {
        id: 'deck-' + Date.now(),
        title: publishTitle.trim(),
        description: publishDesc.trim(),
        author: author,
        likes: [],
        comments: [],
        versions: [versionObj]
      };
      communityDecks.unshift(newPost);
    }

    localStorage.setItem('riftbound_community_decks', JSON.stringify(communityDecks));
    setPublishSuccessMsg('Deck published to Community Decks!');
    setTimeout(() => {
      setPublishSuccessMsg('');
      setPublishModalOpen(false);
      navigate('/community');
    }, 1200);
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
              <p className="text-secondary-glow m-0 text-xs">Browse the card collection and click cards to add them to your deck</p>
            </Col>
            
            <Col md={5} className="text-md-end mt-2 mt-md-0 d-flex gap-2 justify-content-md-end flex-wrap">
              <Button variant="outline-danger" size="sm" onClick={clearDeck}>
                🗑️ Clear
              </Button>
              <Button variant="outline-warning" size="sm" onClick={loadSampleDeck}>
                🧪 Sample Deck
              </Button>
              <Button variant="cyan" size="sm" onClick={exportDeck} disabled={!selectedLegend}>
                📋 Export List
              </Button>
              <Button variant="gold" size="sm" onClick={() => setPublishModalOpen(true)} disabled={!selectedLegend}>
                🚀 Share Deck
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
              <Col lg={7}>
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
              <Col lg={5} className="d-flex justify-content-lg-end">
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

            {/* Sub-Type & Rarity Filters (Row 3) */}
            <Row className="g-3 align-items-center mt-1">
              <Col md={6}>
                <div className="d-flex align-items-center gap-2 text-xs">
                  <span className="text-muted font-semibold uppercase me-1">Sub-Type:</span>
                  <Form.Select
                    size="sm"
                    className="bg-dark text-white border-secondary text-xs"
                    style={{ width: 'auto', minWidth: '130px' }}
                    value={subTypeFilter}
                    onChange={(e) => setSubTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="unit">Units</option>
                    <option value="spell">Spells</option>
                    <option value="gear">Gear</option>
                  </Form.Select>
                </div>
              </Col>

              <Col md={6} className="d-flex justify-content-md-end">
                <div className="d-flex align-items-center gap-2 text-xs">
                  <span className="text-muted font-semibold uppercase me-1">Rarity:</span>
                  <Form.Select
                    size="sm"
                    className="bg-dark text-gold border-secondary text-xs"
                    style={{ width: 'auto', minWidth: '130px' }}
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                  >
                    <option value="all">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="showcase">Showcase</option>
                  </Form.Select>
                </div>
              </Col>
            </Row>
          </Card>

          {/* CARD GRID */}
          {filteredCardPool.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="fs-5">No cards found matching your active filters.</p>
              <Button size="sm" variant="outline-gold" onClick={() => { setSearchQuery(''); setDomainFilter('all'); setSubTypeFilter('all'); setRarityFilter('all'); setActiveCostFilter(null); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 card-pool-scroll">
              {filteredCardPool.map((card, index) => {
                const domColor = getDomainColorClass(card.domains);
                const isSelectedInDeck = (card.type === 'Legend' && selectedLegend?.id === card.id) ||
                                         (card.type === 'Battlefield' && selectedBattlefields.some(b => b.id === card.id));
                                         
                const isRecommended = recommendedChampions.some(rec => 
                  card.name.toLowerCase().includes(rec.name.toLowerCase()) || 
                  (card.tags && card.tags.some(tag => tag.toLowerCase() === rec.name.toLowerCase()))
                );

                const isInvalid = selectedLegend && 
                                  card.type !== 'Legend' && 
                                  card.type !== 'Battlefield' && 
                                  !card.domains.some(d => allowedDomains.includes(d));

                const isBattlefield = card.type === 'Battlefield';

                return (
                  <Col key={`${card.id}-${index}`}>
                    <Card 
                      className={`card-tcg cursor-pointer border border-2 border-domain-${domColor} ${isSelectedInDeck ? 'border-glow' : ''} ${isInvalid ? 'opacity-50' : ''} ${isBattlefield ? 'card-horizontal' : ''}`}
                      onClick={() => !isInvalid && handleCardClick(card)}
                      style={isInvalid ? { cursor: 'not-allowed' } : {}}
                    >
                      {/* Inspect Overlay Badge */}
                      <div 
                        className="position-absolute top-0 start-0 m-1 p-1 rounded-circle bg-dark border border-gold text-gold text-xxs shadow-sm"
                        style={{ zIndex: 10, cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Inspect Card Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedCard(card);
                        }}
                      >
                        🔍
                      </div>

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

        {/* RIGHT COLUMN: Active Deck Sidebar */}
        <div className="deck-builder-sidebar">
          
          {/* Deck Analytics & Progress Header */}
          <div className="p-3 border-bottom border-secondary bg-darker">
            <h2 className="fs-5 fw-bold m-0 text-gold text-glow mb-1">Active Deck</h2>
            <div className="d-flex justify-content-between text-secondary-glow text-xs mb-1">
              <span>Main: <strong className="text-white">{mainDeckTotal}/40</strong></span>
              <span>Runes: <strong className="text-white">{runeDeckTotal}/12</strong></span>
              <span>Battlefields: <strong className="text-white">{selectedBattlefields.length}/3</strong></span>
            </div>
            
            <div className="mb-2">
              <ProgressBar 
                now={overallCompletionPercent} 
                variant={overallCompletionPercent === 100 ? "success" : "cyan"} 
                style={{ height: '6px' }}
                className="bg-dark shadow-sm"
              />
            </div>

            <div className="d-flex justify-content-between text-xxs text-muted flex-wrap">
              <span>Units: <strong className="text-white">{deckComposition.units}</strong></span>
              <span>Spells: <strong className="text-white">{deckComposition.spells}</strong></span>
              <span>Gear: <strong className="text-white">{deckComposition.gear}</strong></span>
              <span>Avg: <strong className="text-gold">{deckComposition.avgCost}⚡</strong></span>
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
                        {getCardCost(item.card)}
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

            {/* DECK LEGALITY STATUS & RULES CHECK */}
            {(() => {
              const isFullyLegal = validationResults.errors.length === 0;
              return (
                <div className="mb-3">
                  <div className="slot-header d-flex justify-content-between align-items-center mb-2">
                    <span className="d-flex align-items-center gap-1">🛡️ Legality Status</span>
                    <Badge bg={isFullyLegal ? "success" : "warning"} className={`text-xs font-bold uppercase ${isFullyLegal ? 'text-white' : 'text-dark'}`}>
                      {isFullyLegal ? '✓ DECK LEGAL' : '⚠️ INCOMPLETE'}
                    </Badge>
                  </div>

                  <Card className={`card-glass p-3 border-secondary-subtle text-xs ${isFullyLegal ? 'border-success-subtle shadow-sm' : ''}`}>
                    <div className="d-flex flex-column gap-2">
                      {/* Legend Check */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary-glow">👑 Champion Legend</span>
                        <Badge bg={validationResults.legend.ok ? "dark" : "danger-subtle"} className={validationResults.legend.ok ? "border border-gold text-gold" : "text-danger border border-danger-subtle"}>
                          {validationResults.legend.ok ? `✓ ${selectedLegend.name}` : '✗ Required'}
                        </Badge>
                      </div>

                      {/* Main Deck Check */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary-glow">⚔️ Main Deck (40 Cards)</span>
                        <Badge bg={validationResults.mainSize.ok ? "success" : "dark"} className={validationResults.mainSize.ok ? "text-white" : "border border-secondary text-muted"}>
                          {mainDeckTotal}/40 {validationResults.mainSize.ok ? '✓' : ''}
                        </Badge>
                      </div>

                      {/* Rune Deck Check */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary-glow">💎 Rune Deck (12 Runes)</span>
                        <Badge bg={validationResults.runeSize.ok ? "success" : "dark"} className={validationResults.runeSize.ok ? "text-white" : "border border-secondary text-muted"}>
                          {runeDeckTotal}/12 {validationResults.runeSize.ok ? '✓' : ''}
                        </Badge>
                      </div>

                      {/* Battlefield Check */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary-glow">🏔️ Battlefields (3 Cards)</span>
                        <Badge bg={validationResults.battlefieldSize.ok ? "success" : "dark"} className={validationResults.battlefieldSize.ok ? "text-white" : "border border-secondary text-muted"}>
                          {selectedBattlefields.length}/3 {validationResults.battlefieldSize.ok ? '✓' : ''}
                        </Badge>
                      </div>

                      {/* Domain Check */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary-glow">🎨 Domain Color Legal</span>
                        <Badge bg={validationResults.domainLegal.ok ? "success" : "danger"} className="text-white">
                          {validationResults.domainLegal.ok ? '✓ Legal' : '✗ Domain Violations'}
                        </Badge>
                      </div>
                    </div>

                    {/* Missing Requirements List */}
                    {!isFullyLegal && (
                      <div className="mt-3 pt-2 border-top border-secondary-subtle">
                        <span className="text-xxs font-bold text-gold uppercase d-block mb-1">Requirements Pending:</span>
                        <ul className="list-unstyled m-0 text-xxs text-secondary-glow d-flex flex-column gap-1">
                          {validationResults.errors.map((err, i) => (
                            <li key={i} className="d-flex align-items-start gap-1">
                              <span className="text-warning">•</span>
                              <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })()}

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

      {/* PUBLISH TO COMMUNITY MODAL */}
      <Modal 
        show={publishModalOpen} 
        onHide={() => setPublishModalOpen(false)} 
        centered 
        contentClassName="bg-dark text-light border-gold shadow-lg"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary-subtle">
          <Modal.Title className="text-gold fs-5 font-bold uppercase m-0">🚀 Share Deck to Community</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {publishSuccessMsg ? (
            <Alert variant="success" className="text-center font-bold animate-pulse m-0">
              ✨ {publishSuccessMsg}
            </Alert>
          ) : (
            <Form onSubmit={handlePublishDeck}>
              <Form.Group className="mb-3" controlId="pubTitleInput">
                <Form.Label className="text-gold text-xs font-bold uppercase">Deck Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Kai'Sa Void Evolution"
                  className="bg-darker border-secondary text-white text-xs py-2"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  required
                />
                <Form.Text className="text-muted text-xxs">
                  If you have already published a deck with this title, your update will be saved as a new version under the same post!
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="pubVersionInput">
                <Form.Label className="text-gold text-xs font-bold uppercase">Version Name / Label</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. v1, v2 - Added Spells"
                  className="bg-darker border-secondary text-white text-xs py-2"
                  value={publishVersionName}
                  onChange={(e) => setPublishVersionName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="pubDescInput">
                <Form.Label className="text-gold text-xs font-bold uppercase">Description / Change Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Explain strategy, synergies, or version changes..."
                  className="bg-darker border-secondary text-white text-xs p-2"
                  value={publishDesc}
                  onChange={(e) => setPublishDesc(e.target.value)}
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => setPublishModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gold" size="sm" type="submit" className="fw-bold uppercase px-3">
                  Publish Deck
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* TEXT DECK IMPORTER MODAL */}
      <Modal 
        show={importTextModalOpen} 
        onHide={() => setImportTextModalOpen(false)} 
        centered 
        contentClassName="bg-dark text-light border-cyan shadow-lg"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary-subtle">
          <Modal.Title className="text-cyan fs-5 font-bold uppercase m-0">📥 Import Decklist from Text</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleImportTextList}>
            <Form.Group className="mb-3" controlId="importRawTextArea">
              <Form.Label className="text-gold text-xs font-bold uppercase">Paste Decklist Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder={`Paste your decklist line-by-line, e.g.:\n1x Kai'Sa\n3x Blazing Scorcher\n12x Fury Rune`}
                className="bg-darker border-secondary text-white text-xs p-2 font-monospace"
                value={importRawText}
                onChange={(e) => setImportRawText(e.target.value)}
                required
              />
              <Form.Text className="text-muted text-xxs">
                Cards will be matched by name against our 950+ card offline database and added directly into your active deck builder slots.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" size="sm" onClick={() => setImportTextModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="cyan" size="sm" type="submit" className="fw-bold uppercase px-3">
                Parse & Import
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* CARD INSPECTOR LIGHTBOX MODAL */}
      {inspectedCard && (
        <Modal
          show={true}
          onHide={() => setInspectedCard(null)}
          centered
          size="lg"
          contentClassName="bg-dark text-light border-gold shadow-lg"
        >
          <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary-subtle">
            <Modal.Title className="text-gold fs-5 font-bold uppercase m-0 d-flex align-items-center gap-2">
              🔍 Card Inspector: {inspectedCard.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="g-4 align-items-center">
              <Col md={5} className="text-center">
                {inspectedCard.image ? (
                  <img
                    src={inspectedCard.image}
                    alt={inspectedCard.name}
                    className="img-fluid rounded border border-gold shadow-lg"
                    style={{ maxHeight: '380px' }}
                  />
                ) : (
                  <div className="p-5 bg-darker rounded border border-secondary text-muted">
                    No Image Available
                  </div>
                )}
              </Col>
              <Col md={7}>
                <div className="mb-3">
                  <h3 className="text-white fw-bold fs-4 mb-1">{inspectedCard.name}</h3>
                  <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
                    <Badge bg="secondary" className="text-xs uppercase">{inspectedCard.type}</Badge>
                    <Badge bg="dark" className="border border-gold text-gold text-xs uppercase">{inspectedCard.rarity || 'Common'}</Badge>
                    {inspectedCard.domains && inspectedCard.domains.map(d => (
                      <Badge key={d} className={`bg-domain-${d.toLowerCase()} text-dark text-xs`}>{d}</Badge>
                    ))}
                  </div>

                  <Row className="g-2 mb-3">
                    <Col xs={4}>
                      <div className="p-2 rounded bg-darker border border-secondary text-center">
                        <span className="text-xxs text-muted d-block uppercase font-bold">Energy Cost</span>
                        <span className="fs-5 fw-bold text-gold">{getCardCost(inspectedCard)}</span>
                      </div>
                    </Col>
                    {inspectedCard.might && (
                      <Col xs={4}>
                        <div className="p-2 rounded bg-darker border border-secondary text-center">
                          <span className="text-xxs text-muted d-block uppercase font-bold">Might</span>
                          <span className="fs-5 fw-bold text-danger">⚔️ {inspectedCard.might}</span>
                        </div>
                      </Col>
                    )}
                    {inspectedCard.power && (
                      <Col xs={4}>
                        <div className="p-2 rounded bg-darker border border-secondary text-center">
                          <span className="text-xxs text-muted d-block uppercase font-bold">Power</span>
                          <span className="fs-5 fw-bold text-cyan">⚡ {inspectedCard.power}</span>
                        </div>
                      </Col>
                    )}
                  </Row>

                  <div className="p-3 rounded bg-darker border border-secondary mb-4">
                    <span className="text-xs text-gold font-bold uppercase d-block mb-1">Ability & Rules Text</span>
                    <p className="text-secondary-glow text-xs m-0" style={{ lineHeight: '1.6' }}>
                      {inspectedCard.text || 'No ability text.'}
                    </p>
                  </div>

                  <div className="d-flex gap-2">
                    <Button 
                      variant="gold" 
                      className="flex-grow-1 fw-bold text-uppercase" 
                      onClick={() => {
                        handleCardClick(inspectedCard);
                        setInspectedCard(null);
                      }}
                    >
                      ➕ Add to Deck
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setInspectedCard(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Modal.Body>
        </Modal>
      )}

      {/* FLOATING TOAST NOTIFICATION CONTAINER */}
      <ToastContainer position="top-end" className="p-3 position-fixed" style={{ zIndex: 9999 }}>
        <Toast
          show={toastState.show}
          onClose={() => setToastState({ ...toastState, show: false })}
          delay={3000}
          autohide
          bg={toastState.variant}
          className="text-white border-0 shadow-lg"
        >
          <Toast.Body className="d-flex justify-content-between align-items-center py-2 px-3 fw-bold text-xs">
            <span>✨ {toastState.message}</span>
            <Button variant="link" className="text-white p-0 ms-2 text-decoration-none" onClick={() => setToastState({ ...toastState, show: false })}>
              ✕
            </Button>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
