import { atom } from 'recoil';
import { ATOMS_KEYS } from './atom-keys';

export const isSideBarOpenAtom = atom<boolean>({
	key: ATOMS_KEYS.IS_SIDEBAR_OPEN,
	default: false,
});
