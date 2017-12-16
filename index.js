const https = require('https')

let crypto = null

exports.decorateHyper = (Hyper, { React }) => {
  const e = React.createElement
  return class extends React.PureComponent {
    constructor (props) {
      super(props)

      this.state = {
        crypto: null
      }

      this.markets = ['USDT-BTC', 'USDT-ETH', 'USDT-LTC', 'BTC-ETH', 'BTC-LTC']
      this.checkCount = 0
      this.componentDidMount = this.componentDidMount.bind(this)
    }

    loadCrypto (cb) {
      const currentMarket = this.markets[this.checkCount]
      const url =
        'https://bittrex.com/api/v1.1/public/getticker?market=' + currentMarket
      https.get(url, res => {
        res.setEncoding('utf8')
        let body = ''
        res.on('data', data => {
          body += data
        })
        res.on('end', () => {
          body = JSON.parse(body)
          crypto = crypto || {}
          crypto[this.checkCount] = Object.assign({currentMarket}, body.result)
          if (this.checkCount >= this.markets.length - 1) {
            this.checkCount = 0
          } else {
            this.checkCount++
          }

          if (cb) cb(null, this.checkCount)
        })
      })
    }

    render () {
      const { customChildren } = this.props
      const existingChildren = customChildren ? customChildren instanceof Array ? customChildren : [customChildren] : []
      const tickerData = this.state.crypto && Object.keys(this.state.crypto).length ? Object.keys(this.state.crypto).reduce((prev, key) => { return prev + this.markets[key] + ': ' + this.state.crypto[key].Last.toFixed(5) + ' | ' }, 'BITTREX: ') : 'Markets loading...'
      return (
                e(Hyper, Object.assign({}, this.props, {
                  customInnerChildren: existingChildren.concat(e('footer', { className: 'footer_footer' },
                        e('div', { className: 'footer_group group_overflow' },
                            e('div', { className: 'component_component component_crypto' },
                                e('div', { className: 'component_item item_icon item_crypto item_clickable', hidden: !this.state.crypto, style: {'border-top': '1px solid teal', width: '100%', position: 'fixed', margin: 'auto', 'padding-left': '15px', bottom: '0px', 'font-size': '12px', color: '#08ecec'} }, tickerData)
                            )
                        )
                    ))
                }))
      )
    }

    componentDidMount () {
      const loadAndSet = (cb) => {
        this.loadCrypto(cb)
        this.setState({
          crypto: Object.assign({}, crypto)
        })
      }

      setTimeout(() => {
        const quickStart = (err, count) => {
          if (err) throw new Error(err)
          if (count >= this.markets.length - 1) {
            console.log('setting interval')
            clearInterval(this.cryptoCheck)
            this.cryptoCheck = setInterval(() => {
              loadAndSet()
            }, 8000)
          } else {
            loadAndSet(quickStart)
          }
        }

        quickStart(null, 0)
      }, 100)
    }

    componentWillUnmount () {
      clearInterval(this.cryptoCheck)
    }
    }
}
