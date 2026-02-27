import { GlobalStyles } from '@contentful/f36-components'
import { SDKProvider } from '@contentful/react-apps-toolkit'

import { createRoot } from 'react-dom/client'
import App from './App'
import LocalhostWarning from './components/LocalhostWarning'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
const queryClient = new QueryClient()

if (import.meta.env.DEV && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />)
} else {
  root.render(
    <SDKProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalStyles />
        <App />
      </QueryClientProvider>
    </SDKProvider>,
  )
}
