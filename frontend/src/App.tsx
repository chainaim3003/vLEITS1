import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { VerifyPage } from './pages/VerifyPage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        {/* Navigation */}
        <nav style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <Link
                to="/"
                style={{ textDecoration: 'none', color: '#1f2937', fontWeight: '500', fontSize: '1.125rem' }}
              >
                🏠 Home
              </Link>
              <Link
                to="/verify"
                style={{ textDecoration: 'none', color: '#1f2937', fontWeight: '500' }}
              >
                🔐 Verify Seller
              </Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
        🔐 vLEI Verification System
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#6b7280', textAlign: 'center', marginBottom: '3rem' }}>
        Verify trading partners using blockchain-based credentials
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <Link
          to="/verify"
          style={{
            display: 'block',
            padding: '2rem',
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            transition: 'box-shadow 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
            🔍 Verify Seller
          </h2>
          <p style={{ color: '#6b7280' }}>
            Check if a seller is legitimate before conducting business
          </p>
        </Link>
      </div>
    </div>
  );
}

export default App;
