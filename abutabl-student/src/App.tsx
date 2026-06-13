import { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { useRecoilValue } from 'recoil';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import axios from './axios-instance';
import 'react-toastify/dist/ReactToastify.css';
import { TLocale, messages } from './translations';
import { langState } from 'store';
import Routes from 'routes/routes';
import { Provider } from 'react-redux';
import { store } from 'redux-toolkit/store/store';

function App() {
	/* ------------------------------- Local State ------------------------------ */
	const langType = useRecoilValue(langState);
	const [lang, setLang] = useState<TLocale>(langType);

	const queryClient = useMemo(() => new QueryClient(), []);
	/* --------------------------------- Effects -------------------------------- */
	useEffect(() => {
		axios.defaults.headers.common['Accept-Language'] = lang;
		queryClient.invalidateQueries();
	}, [lang, queryClient]);

	useEffect(() => {
		setLang(langType);
		document.documentElement.lang = langType;
		document.documentElement.dir = langType === 'ar' ? 'rtl' : 'ltr';
	}, [langType]);
	return (
		<div className="App">

			<Provider store={store}>

				<IntlProvider locale={lang} messages={messages[lang]}>
					<QueryClientProvider client={queryClient}>
						<MantineProvider withGlobalStyles withNormalizeCSS>
							<Routes />
						</MantineProvider>
					</QueryClientProvider>
				</IntlProvider>
			</Provider>
		</div>
	);
}

export default App;
