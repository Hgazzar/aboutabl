import { atom } from 'recoil';
import { ATOMS_KEYS } from './atom-keys';

export const isLoadingAtom = atom<boolean>({
	key: ATOMS_KEYS.IS_LOADING,
	default: true,
});
