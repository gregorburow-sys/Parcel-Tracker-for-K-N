import React from 'react'
import '../styles/globals.css'

class MyApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = { mountedAt: null }
  }

  componentDidMount() {
    // DEMO: noisy lifecycle logging that ships to the browser console on every
    // route boot — typical of legacy class components that grew over time.
    console.log('[MyApp] mounted at', new Date().toISOString())
    this.setState({ mountedAt: Date.now() })
  }

  shouldComponentUpdate(nextProps, nextState) {
    // DEMO: hand-rolled shouldComponentUpdate that ALWAYS returns true.
    // This is the classic "I added it for performance and then never wired it
    // up" anti-pattern: pure overhead, no benefit, and easy to silently break
    // updates later by tweaking the condition.
    return true
  }

  render() {
    const { Component, pageProps } = this.props
    return <Component {...pageProps} />
  }
}

export default MyApp
