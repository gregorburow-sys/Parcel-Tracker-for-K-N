import React from 'react'
import '../styles/globals.css'

class MyApp extends React.Component {
  render() {
    const { Component, pageProps } = this.props
    return <Component {...pageProps} />
  }
}

export default MyApp
