import { useState } from 'react';
import { VerificationService } from '../services/api.service';
import type { VerificationResponse } from '../types/api.types';

export function VerifyPage() {
  const [sellerAlias, setSellerAlias] = useState('jupiterSellerAgent');
  const [buyerAlias, setBuyerAlias] = useState('tommyBuyerAgent');
  const [transactionValue, setTransactionValue] = useState(50000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await VerificationService.verifyTradingPartner({
        seller: {
          identifier: sellerAlias,
          identifierType: 'alias',
        },
        buyer: {
          identifier: buyerAlias,
          identifierType: 'alias',
        },
        transaction: {
          type: 'purchase_order',
          value: transactionValue,
          currency: 'USD',
        },
      });
      
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getTrustScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 75) return '#3b82f6'; // blue
    if (score >= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getRecommendationColor = (rec: string): string => {
    switch (rec) {
      case 'APPROVED': return '#10b981';
      case 'APPROVED_WITH_CONDITIONS': return '#3b82f6';
      case 'REVIEW_REQUIRED': return '#eab308';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🔐 Seller Verification
          </h1>
          <p style={{ color: '#6b7280' }}>
            Verify a seller before conducting business
          </p>
        </div>

        {/* Form */}
        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Verification Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Seller Identifier
              </label>
              <input
                type="text"
                value={sellerAlias}
                onChange={(e) => setSellerAlias(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                placeholder="e.g., jupiterSellerAgent"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Buyer Identifier (You)
              </label>
              <input
                type="text"
                value={buyerAlias}
                onChange={(e) => setBuyerAlias(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                placeholder="e.g., tommyBuyerAgent"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Transaction Value (USD)
              </label>
              <input
                type="number"
                value={transactionValue}
                onChange={(e) => setTransactionValue(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {loading ? 'Verifying...' : 'Verify Seller'}
              </button>

              {result && (
                <button
                  onClick={() => { setResult(null); setError(null); }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#991b1b', fontWeight: '500' }}>❌ Error: {error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Verification Card */}
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Verification Result</h2>
                
                {/* Trust Score Badge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    background: getTrustScoreColor(result.decision.trustScore),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}>
                    {result.decision.trustScore}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
                    Trust Score
                  </span>
                </div>
              </div>

              {/* Decision */}
              <div style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: `2px solid ${getRecommendationColor(result.decision.recommendation)}`,
                background: `${getRecommendationColor(result.decision.recommendation)}10`,
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.125rem', color: getRecommendationColor(result.decision.recommendation) }}>
                    {result.decision.recommendation}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>
                    {result.decision.approved ? '✅ Approved' : '❌ Not Approved'}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Confidence: <strong>{result.decision.confidence}</strong> | Risk Level: <strong>{result.decision.riskLevel}</strong>
                </div>
              </div>

              {/* Reasoning */}
              {result.decision.reasoning && result.decision.reasoning.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Reasoning:</h3>
                  <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                    {result.decision.reasoning.map((reason, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', color: '#4b5563' }}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {result.redFlags.length > 0 && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>🚨 Red Flags:</h3>
                  <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                    {result.redFlags.map((flag, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', color: '#991b1b' }}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.375rem' }}>
                  <h3 style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>⚠️ Warnings:</h3>
                  <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                    {result.warnings.map((warning, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', color: '#92400e' }}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Seller Details */}
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Seller Details</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Agent</h3>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{result.seller.agent.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{result.seller.agent.role}</p>
                </div>

                <div>
                  <h3 style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Company</h3>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{result.seller.company.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>LEI: {result.seller.company.lei}</p>
                </div>
              </div>

              {/* Credentials Status */}
              <div>
                <h3 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Credentials Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {Object.entries(result.seller.credentials).map(([key, cred]) => (
                    cred && (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span>{cred.type}</span>
                        <span style={{ color: cred.valid ? '#10b981' : '#ef4444' }}>
                          {cred.valid ? '✅' : '❌'} {cred.status}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Chain Verification */}
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <h3 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Chain Verification</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div>Complete: {result.seller.chainVerification.complete ? '✅' : '❌'}</div>
                  <div>Valid: {result.seller.chainVerification.valid ? '✅' : '❌'}</div>
                  <div>Credentials: {result.seller.chainVerification.credentialCount}/5</div>
                  <div>All Valid: {result.seller.chainVerification.allCredentialsValid ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {result.decision.approved ? (
                <button style={{
                  flex: 1,
                  background: '#10b981',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}>
                  ✅ Proceed to Checkout
                </button>
              ) : (
                <button style={{
                  flex: 1,
                  background: '#ef4444',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}>
                  ❌ Transaction Not Allowed
                </button>
              )}
              <button style={{
                padding: '1rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '600',
              }}>
                Contact Seller
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
