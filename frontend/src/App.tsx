import { useState, useEffect } from 'react'
import './App.css'

interface Recommendation {
  item_id: string;
  dish_name: string;
  canteen_name: string;
  health_score?: number;
  estimated_calories?: number;
  tags?: string[];
  ui_text?: {
    title: string;
    body: string;
  };
  order_count?: number;
}

interface ApiResponse {
  user_id: string;
  remaining_calories_today: number;
  frequent_favorites: Recommendation[];
  healthy_alternatives: Recommendation[];
}

function App() {
  const [activeUser, setActiveUser] = useState('user-b-002');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Enrichment state
  const [enrichDishName, setEnrichDishName] = useState('');
  const [enrichCanteen, setEnrichCanteen] = useState('Main Canteen');
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [mealLogs, setMealLogs] = useState<any[]>([]);
  
  // Admin state
  const [adminDishName, setAdminDishName] = useState('');
  const [adminCanteen, setAdminCanteen] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState('');
  
  const [canteenList, setCanteenList] = useState<string[]>([]);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8080/canteens`);
        const json = await res.json();
        setCanteenList(json.canteens);
      } catch (error) {
        console.error("error fetching canteens", error);
      }
    };
    fetchCanteens();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8080/recommendations/${activeUser}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const json = await res.json();
        setData(json);
        setMealLogs([]); // Clear logs when switching users
      } catch (error) {
        console.error("error fetch data user", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeUser]);

  const handleEat = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrichLoading(true);
    
    try {
      const res = await fetch(`http://127.0.0.1:8080/eat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: activeUser,
          dish_name: enrichDishName, 
          canteen_name: enrichCanteen 
        })
      });
      if (!res.ok) throw new Error('Failed to log meal');
      const updatedData = await res.json();
      
      // Update the main UI with the new recommendations instantly!
      setData(updatedData.recommendations);
      
      setMealLogs(prev => [updatedData.logged_item, ...prev]);
      setEnrichDishName('');
    } catch (error) {
      console.error("error logging meal", error);
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8080/reset/${activeUser}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to reset');
      const updatedData = await res.json();
      setData(updatedData);
      setMealLogs([]);
    } catch (error) {
      console.error("error resetting", error);
    }
  };

  const handleAdminAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminSuccess('');
    try {
      const res = await fetch(`http://127.0.0.1:8080/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_name: adminDishName, canteen_name: adminCanteen || 'Unknown Canteen' })
      });
      if (!res.ok) throw new Error('Failed to add to database');
      const json = await res.json();
      setAdminSuccess(`Successfully added ${json.dish_name} to ${json.canteen_name} in Database!`);
      setAdminDishName('');
      
      // Refresh canteen list
      if (!canteenList.includes(json.canteen_name)) {
        setCanteenList(prev => [...prev, json.canteen_name]);
      }
    } catch (error) {
      console.error("error adding admin item", error);
    } finally {
      setAdminLoading(false);
      setTimeout(() => setAdminSuccess(''), 4000);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Canteen AI.</h1>
        <p className="subtitle">Smart, personalized food recommendations.</p>
      </header>

      {/* MEAL LOGGING FORM */}
      <div className="section admin-section">
        <h2 style={{ fontSize: '1.4rem' }}>🍽️ Log Your Meal</h2>
        <p className="subtitle" style={{marginBottom: '1rem', fontSize: '0.95rem'}}>
          Eat something new? AI will analyze its nutrition, deduct your budget, and update your smart picks instantly.
        </p>
        
        <datalist id="canteen-list">
          {canteenList.map(c => <option key={c} value={c} />)}
        </datalist>

        <form className="glass-card enrich-form" onSubmit={handleEat}>
          <div className="form-group">
            <input 
              type="text" 
              className="glass-input"
              placeholder="e.g. Double Cheeseburger" 
              value={enrichDishName}
              onChange={(e) => setEnrichDishName(e.target.value)}
              required
            />
            <input 
              type="text"
              list="canteen-list"
              className="glass-input"
              placeholder="Select or Type Canteen..."
              value={enrichCanteen}
              onChange={(e) => setEnrichCanteen(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn" disabled={enrichLoading || !enrichDishName}>
              {enrichLoading ? 'Eating...' : 'Eat This!'}
            </button>
          </div>
        </form>

        <h2 style={{ fontSize: '1.4rem', marginTop: '2.5rem' }}>🏢 Database Admin: Add Menu</h2>
        <p className="subtitle" style={{marginBottom: '1rem', fontSize: '0.95rem'}}>
          Add a new food and map it to a specific canteen in the database WITHOUT logging it to your stomach. Type a new canteen name to create it.
        </p>
        <form className="glass-card enrich-form" onSubmit={handleAdminAdd}>
          <div className="form-group">
            <input 
              type="text" 
              className="glass-input"
              placeholder="e.g. Nasi Padang Bundo" 
              value={adminDishName}
              onChange={(e) => setAdminDishName(e.target.value)}
              required
            />
            <input 
              type="text"
              list="canteen-list"
              className="glass-input"
              placeholder="Select or Type New Canteen..."
              value={adminCanteen}
              onChange={(e) => setAdminCanteen(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn" disabled={adminLoading || !adminDishName} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {adminLoading ? 'Saving...' : 'Save to DB'}
            </button>
          </div>
          {adminSuccess && (
            <div style={{ marginTop: '1rem', color: '#10b981', fontWeight: 600 }}>
              ✅ {adminSuccess}
            </div>
          )}
        </form>

        {mealLogs.length > 0 && (
          <div className="meal-logs-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📝 Today's Meal Logs
            </h3>
            {mealLogs.map((log, idx) => (
              <div className="enrich-success" key={idx} style={{ padding: '1.25rem', marginTop: 0 }}>
                <div className="success-header" style={{ marginBottom: '0.5rem' }}>
                  <span className="success-icon">✅</span>
                  <strong>{log.dish_name} logged successfully!</strong>
                </div>
                <div className="success-details">
                  AI computed <strong>{log.estimated_calories} kcal</strong> with a Health Score of <strong>{log.health_score}/5</strong>.
                  {log.balance_message && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', borderLeft: '3px solid #10b981', color: '#a7f3d0', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      💡 <strong>AI Analysis:</strong> {log.balance_message}
                    </div>
                  )}
                </div>
                <div className="tags" style={{ marginTop: '0.75rem' }}>
                  {log.tags?.map((tag: string) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="user-controls">
        <button 
          className={`user-btn ${activeUser === 'user-a-001' ? 'active' : ''}`}
          onClick={() => setActiveUser('user-a-001')}
        >
          User A (Katsu Lover)
        </button>
        <button 
          className={`user-btn ${activeUser === 'user-b-002' ? 'active' : ''}`}
          onClick={() => setActiveUser('user-b-002')}
        >
          User B (Tight Budget)
        </button>
        <button 
          className={`user-btn ${activeUser === 'user-c-003' ? 'active' : ''}`}
          onClick={() => setActiveUser('user-c-003')}
        >
          User C (Blank Slate)
        </button>
      </div>

      {loading || !data ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing profile & crafting recommendations...</p>
        </div>
      ) : (
        <>
          <div className={`budget-alert ${data.remaining_calories_today > 0 ? 'safe' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {data.remaining_calories_today > 0 
                ? `You have ${data.remaining_calories_today} kcal remaining for today. Great job!` 
                : `Warning: You are over your daily calorie limit by ${Math.abs(data.remaining_calories_today)} kcal!`}
            </div>
            <button 
              onClick={handleReset}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid currentColor', color: 'inherit', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
            >
              🔄 Reset Day
            </button>
          </div>

          {data.healthy_alternatives && data.healthy_alternatives.length > 0 && (
            <div className="section">
              <h2>✨ AI Smart Picks for You</h2>
              <div className="grid">
                {data.healthy_alternatives.map((item) => (
                  <div className="glass-card" key={item.item_id}>
                    <div className="card-header">
                      <span className="canteen-badge">{item.canteen_name}</span>
                      {item.health_score && (
                        <span className="score-badge">♥ {item.health_score}/5</span>
                      )}
                    </div>
                    
                    <div className="dish-name">{item.dish_name}</div>
                    
                    <div className="metrics">
                      <div className="metric-item">
                        ⚡ <strong>{item.estimated_calories}</strong> kcal
                      </div>
                    </div>

                    {item.tags && (
                      <div className="tags">
                        {item.tags.map(tag => (
                          <span className="tag" key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    {item.ui_text && (
                      <div className="ai-message">
                        <div className="ai-title">{item.ui_text.title}</div>
                        <div className="ai-body">{item.ui_text.body}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.frequent_favorites && data.frequent_favorites.length > 0 && (
            <div className="section" style={{ marginTop: '2rem' }}>
              <h2>🕒 Your Usuals</h2>
              <div className="grid" style={{ opacity: 0.8 }}>
                {data.frequent_favorites.map((item) => (
                  <div className="glass-card" key={item.item_id}>
                    <div className="card-header">
                      <span className="canteen-badge">{item.canteen_name}</span>
                    </div>
                    <div className="dish-name">{item.dish_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
