process.env.NODE_ENV = process.env.NODE_ENV || 'development'

export default {
  port: parseInt(process.env.PORT, 10),

  pairs: [
    'ALGO-USD',
    'ATOM-USD',
    'BAL-USD',
    'BAND-USD',
    'BCH-USD',
    'BNT-USD',
    'BTC-USD',
    'COMP-USD',
    'CRV-USD',
    'DASH-USD',
    'EOS-USD',
    'ETC-USD',
    'ETH-USD',
    'GRT-USD',
    'KNC-USD',
    'LINK-USD',
    'LRC-USD',
    'LTC-USD',
    'MKR-USD',
    'NMR-USD',
    'OMG-USD',
    'OXT-USD',
    'REN-USD',
    'REP-USD',
    'SNX-USD',
    'XLM-USD',
    'XTZ-USD',
    'YFI-USD',
    'ZEC-USD',
    'ZRX-USD',
  ],

  periods: [
    // minutes
    1 * 60,
    5 * 60,
    15 * 60,
    // hours
    1 * 60 * 60,
    6 * 60 * 60,
    24 * 60 * 60,
  ],

  coinbasePro: (() => {
    const useSandbox = process.env.COINBASE_PRO_USE_SANDBOX === 'true'
    const envVarKey = `COINBASE_PRO_${useSandbox ? 'SANDBOX_' : ''}API_`
    return {
      apiKey: process.env[envVarKey + 'KEY']!,
      apiSecret: process.env[envVarKey + 'SECRET']!,
      passphrase: process.env[envVarKey + 'PASSPHRASE']!,
      useSandbox,
    }
  })(),

  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  agenda: {
    dbCollection: process.env.AGENDA_DB_COLLECTION,
    concurrency: parseInt(process.env.AGENDA_CONCURRENCY, 10),
  },

  api: {
    prefix: '/api',
  },
}
