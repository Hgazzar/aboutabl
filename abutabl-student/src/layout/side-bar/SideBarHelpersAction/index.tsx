import { Grid } from '@mantine/core';
import { useIntl } from 'react-intl';
import { SideBarHelpersActionWrapper } from '../styles';
import { useRecoilState } from 'recoil';
import { langState } from 'store';
import Cookies from 'js-cookie';
import { COOKIES_KEYS } from 'app-constants/constants';
import { useEffect } from 'react';
import TranslateIcon from 'assets/images/svg/translate.svg?react';
import Logout from 'assets/images/svg/logout.svg?react';
import { useDispatch } from 'react-redux';
import { logout } from 'redux-toolkit/reducer/LogputReducer';
import { useNavigate } from 'react-router-dom';
import type { Ilogin } from 'views/auth/types/login.type';

export default function SideBarHelpersAction() {
	const { formatMessage } = useIntl();
	const [lang, setLang] = useRecoilState(langState);
	const dispatch = useDispatch()
	const nagivate = useNavigate()
	const getLangSelected = Cookies.get(COOKIES_KEYS.LanguageAdded);
	const switchLang = () => {
		if (lang === 'ar') {
			setLang('en');
			Cookies.set(COOKIES_KEYS.LanguageAdded, 'en');
		}
		if (lang === 'en') {
			setLang('ar');
			Cookies.set(COOKIES_KEYS.LanguageAdded, 'ar');
		}
	};

	useEffect(() => {
		if (!getLangSelected) return;
		setLang(getLangSelected as 'ar' | 'en');
	}, [getLangSelected, setLang]);

	return (
		<SideBarHelpersActionWrapper>
			<Grid>
				<Grid.Col xs={12}>
					<div className="langWrapper">
						<div onClick={() => switchLang()}>
							<TranslateIcon />
							<p>{formatMessage({ id: 'lang' })}</p>
						</div>
						<div className='mt-5' onClick={async () => {
							try {
								await dispatch(logout({ code: 0, password: '' } as Ilogin));
							} catch {
								/* session cleared in logout thunk finally */
							}
							nagivate('/login', { replace: true });
						}}>

							<Logout />
							<p>{formatMessage({ id: 'logout' })}</p>

						</div>
					</div>
				</Grid.Col>
			</Grid>
		</SideBarHelpersActionWrapper>
	);
}
