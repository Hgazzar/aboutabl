import { atom } from 'recoil';
import { ATOMS_KEYS } from './atom-keys';
import Cookies from 'js-cookie';

export const langState = atom<'ar' | 'en'>({
	key: ATOMS_KEYS.LANGSTATE,
	default: (Cookies.get('LanguageAdded') as 'en' | 'ar') ?? 'en',
});
