import '@/styles/globals.scss'

import { GlobalStyles } from '@contentful/f36-components'
import { SDKProvider } from '@contentful/react-apps-toolkit'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
	return (
		<SDKProvider>
			<GlobalStyles />
			<Component {...pageProps} />
		</SDKProvider>
	)
}
