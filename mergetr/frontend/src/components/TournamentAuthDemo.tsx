import { useState, useEffect } from 'react';
import TournamentService, {
  type AuthSupportInfo,
  type AuthData
} from '../services/tournamentService';
import './TournamentAuthDemo.css';

export default function TournamentAuthDemo() {
  const [authModes, setAuthModes] = useState<AuthSupportInfo | null>(null);
  const [detectedAuth, setDetectedAuth] = useState<AuthData | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAuthInfo();
  }, []);

  const loadAuthInfo = async () => {
    try {
      setLoading(true);

      const [modesResult, authResult] = await Promise.all([
        TournamentService.getAuthModes(),
        TournamentService.testAuthDetection('DemoPlayer')
      ]);

      setAuthModes(modesResult);
      setDetectedAuth(authResult.authData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const testAuthMode = async (mode: string, testData: any = {}) => {
    try {
      setLoading(true);

      const testResult: any = {
        mode,
        timestamp: new Date().toISOString(),
        data: testData,
        result: null,
        error: null
      };

      // Simuler différents tests selon le mode
      switch (mode) {
        case 'auto':
          testResult.result = await TournamentService.testAuthDetection(testData.alias);
          break;
        case 'oauth':
          testResult.result = {
            simulated: true,
            message: `Test OAuth avec ${testData.provider || 'google'} et token: ${testData.token?.substring(0, 10)}...`
          };
          break;
        case 'jwt':
          testResult.result = {
            simulated: true,
            message: `Test JWT avec token: ${testData.token?.substring(0, 10)}...`
          };
          break;
        case 'session':
          testResult.result = {
            simulated: true,
            message: `Test session avec alias: ${testData.alias || 'auto'}`
          };
          break;
        case 'anonymous':
          testResult.result = {
            simulated: true,
            message: `Test anonyme avec alias: ${testData.alias}`
          };
          break;
        default:
          testResult.result = { message: 'Mode de test non supporté' };
      }

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Garder les 10 derniers résultats

    } catch (err: any) {
      setTestResults(prev => [{
        mode,
        timestamp: new Date().toISOString(),
        data: testData,
        result: null,
        error: err.message
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !authModes) {
    return (
      <div className="auth-demo-container">
        <div className="loading">Chargement de la démo d'authentification...</div>
      </div>
    );
  }

  return (
    <div className="auth-demo-container">
      <div className="auth-demo-header">
        <h1>🔐 Démo des modes d'authentification</h1>
        <p>Testez tous les modes d'authentification supportés par le système de tournois</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* État d'authentification actuel */}
      <div className="current-auth-section">
        <h2>État d'authentification actuel</h2>
        <div className="auth-status-card">
          {detectedAuth ? (
            <div className="auth-detected">
              <div className="auth-icon">🔓</div>
              <div className="auth-info">
                <h3>Utilisateur connecté</h3>
                <div className="auth-details">
                  <div><strong>Alias:</strong> {detectedAuth.userAlias || detectedAuth.username}</div>
                  <div><strong>Provider:</strong> {detectedAuth.provider}</div>
                  <div><strong>Source:</strong> {detectedAuth.source}</div>
                  {detectedAuth.email && <div><strong>Email:</strong> {detectedAuth.email}</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="auth-not-detected">
              <div className="auth-icon">🔒</div>
              <div className="auth-info">
                <h3>Aucune authentification détectée</h3>
                <p>Les inscriptions se feront en mode anonyme</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modes d'authentification supportés */}
      {authModes && (
        <div className="auth-modes-section">
          <h2>Modes d'authentification supportés</h2>
          <div className="modes-grid">
            {authModes.supported.map((mode) => (
              <div key={mode.mode} className="mode-card">
                <div className="mode-header">
                  <h3>{mode.mode.toUpperCase()}</h3>
                  <div className="mode-icon">
                    {mode.mode === 'oauth' && '🔐'}
                    {mode.mode === 'jwt' && '🔑'}
                    {mode.mode === 'session' && '🏠'}
                    {mode.mode === 'anonymous' && '👤'}
                    {mode.mode === 'auto' && '🤖'}
                  </div>
                </div>
                <p className="mode-description">{mode.description}</p>
                <div className="mode-details">
                  <strong>Endpoint:</strong> {mode.endpoint}
                </div>
                <div className="mode-requirements">
                  <strong>Requis:</strong>
                  <ul>
                    {mode.requires.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                {mode.providers && (
                  <div className="mode-providers">
                    <strong>Providers:</strong> {mode.providers.join(', ')}
                  </div>
                )}

                {/* Boutons de test */}
                <div className="mode-actions">
                  {mode.mode === 'auto' && (
                    <button
                      onClick={() => testAuthMode('auto', { alias: 'TestPlayer' })}
                      disabled={loading}
                      className="test-btn"
                    >
                      Tester auto-détection
                    </button>
                  )}

                  {mode.mode === 'oauth' && (
                    <div className="oauth-tests">
                      {mode.providers?.map(provider => (
                        <button
                          key={provider}
                          onClick={() => testAuthMode('oauth', {
                            provider,
                            token: `fake_${provider}_token_${Date.now()}`
                          })}
                          disabled={loading}
                          className="test-btn oauth-test"
                        >
                          Test {provider}
                        </button>
                      ))}
                    </div>
                  )}

                  {mode.mode === 'jwt' && (
                    <button
                      onClick={() => testAuthMode('jwt', {
                        token: `fake_jwt_token_${Date.now()}`
                      })}
                      disabled={loading}
                      className="test-btn"
                    >
                      Tester JWT
                    </button>
                  )}

                  {mode.mode === 'session' && (
                    <button
                      onClick={() => testAuthMode('session', { alias: 'SessionPlayer' })}
                      disabled={loading}
                      className="test-btn"
                    >
                      Tester session
                    </button>
                  )}

                  {mode.mode === 'anonymous' && (
                    <button
                      onClick={() => testAuthMode('anonymous', { alias: 'AnonymousPlayer' })}
                      disabled={loading}
                      className="test-btn"
                    >
                      Tester anonyme
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priorité d'auto-détection */}
      {authModes && (
        <div className="priority-section">
          <h2>Priorité d'auto-détection</h2>
          <div className="priority-list">
            {authModes.autoDetection.priority.map((priority, index) => (
              <div key={index} className="priority-item">
                <span className="priority-number">{index + 1}</span>
                <span className="priority-text">{priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultats des tests */}
      {testResults.length > 0 && (
        <div className="test-results-section">
          <h2>Résultats des tests</h2>
          <div className="test-results">
            {testResults.map((result, index) => (
              <div key={index} className={`test-result ${result.error ? 'error' : 'success'}`}>
                <div className="test-header">
                  <strong>{result.mode.toUpperCase()}</strong>
                  <span className="test-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="test-content">
                  {result.error ? (
                    <div className="test-error">❌ {result.error}</div>
                  ) : (
                    <div className="test-success">
                      ✅ {result.result?.message || JSON.stringify(result.result, null, 2)}
                    </div>
                  )}
                </div>
                {Object.keys(result.data).length > 0 && (
                  <div className="test-data">
                    <strong>Données de test:</strong> {JSON.stringify(result.data)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="test-actions">
            <button
              onClick={() => setTestResults([])}
              className="clear-btn"
            >
              Effacer les résultats
            </button>
          </div>
        </div>
      )}

      {/* Instructions d'utilisation */}
      <div className="instructions-section">
        <h2>Instructions d'utilisation</h2>
        <div className="instructions">
          <div className="instruction-item">
            <h4>🔐 Mode OAuth</h4>
            <p>Connectez-vous via Google, GitHub, 42, etc. Le token sera automatiquement détecté.</p>
          </div>
          <div className="instruction-item">
            <h4>🔑 Mode JWT</h4>
            <p>Utilisez un token JWT valide dans le header Authorization: Bearer.</p>
          </div>
          <div className="instruction-item">
            <h4>🏠 Mode Session</h4>
            <p>Connectez-vous via le système de session Express classique.</p>
          </div>
          <div className="instruction-item">
            <h4>👤 Mode Anonyme</h4>
            <p>Inscrivez-vous avec un simple alias, sans authentification.</p>
          </div>
          <div className="instruction-item">
            <h4>🤖 Mode Auto</h4>
            <p>Le système détecte automatiquement le meilleur mode disponible.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
