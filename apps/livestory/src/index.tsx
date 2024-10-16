import { render } from 'react-dom'

import { GlobalStyles } from '@contentful/f36-components'
import { SDKProvider } from '@contentful/react-apps-toolkit'

import React from 'react'
import App from './App'

const root = document.getElementById('root')

render(
    <SDKProvider>
        <GlobalStyles />
        <App />
    </SDKProvider>,
    root
)
