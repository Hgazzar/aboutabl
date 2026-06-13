import { useRoutesConst } from 'routes';
import SideBarItem from '../SideBarItem';
import { SideBarLinks } from '../styles';

export default function SideBarLinksSection() {
	const { ROUTES } = useRoutesConst();

	return (
		<SideBarLinks>
			<SideBarItem routes={ROUTES.learn || ROUTES.learnDetails} />
			<SideBarItem routes={ROUTES.todo} />
			<SideBarItem routes={ROUTES.liveGames} />

			<SideBarItem routes={ROUTES.profile} />
			{/* Support/ticketing hidden until flows are stable */}
		</SideBarLinks>
	);
}
