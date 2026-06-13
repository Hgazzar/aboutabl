import { atom } from 'recoil';
import { ATOMS_KEYS } from './atom-keys';

export const isPartiallyLoadingAtom = atom<boolean>({
	key: ATOMS_KEYS.IS_PARTIALLY_LOADING,
	default: true,
});
