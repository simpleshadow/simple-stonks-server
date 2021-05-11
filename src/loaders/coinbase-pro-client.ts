import Debug from 'debug'
import { CoinbasePro } from 'coinbase-pro-node'
import logSymbols from 'log-symbols'

import config from '../../config'

const debug = Debug('loaders:coinbase-pro-client')

const {
  coinbasePro: { apiKey, apiSecret, passphrase, useSandbox },
} = config

export default () => {
  const coinbaseProClient = new CoinbasePro({
    apiKey,
    apiSecret,
    passphrase,
    useSandbox,
  })

  debug(`${logSymbols.success} coinbase pro loaded (${useSandbox ? 'sandbox' : 'prod'})`)

  return coinbaseProClient
}
