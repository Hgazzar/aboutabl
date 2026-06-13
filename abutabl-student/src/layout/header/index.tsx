import { Button } from '@mantine/core';
import Menu from 'assets/images/svg/menu.svg?react';
import Close from 'assets/images/svg/close.svg?react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { isSideBarOpenAtom } from 'store/is-sidebarOpen';
import { BurgerMenu } from './styles';

export default function Header() {
	/* ------------------------------- Global State ------------------------------ */
	const isSideBarOpen = useRecoilValue(isSideBarOpenAtom);
	const setSidebarOpen = useSetRecoilState(isSideBarOpenAtom);
	return (
		<BurgerMenu>
			{isSideBarOpen ? (
				<Button onClick={() => setSidebarOpen(false)}>
					<Close />
				</Button>
			) : (
				<Button onClick={() => setSidebarOpen(true)}>
					<Menu />
				</Button>
			)}
		</BurgerMenu>
	);
}
