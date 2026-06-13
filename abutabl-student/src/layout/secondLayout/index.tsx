import { SecondLayoutWrapper } from 'layout/styles';
import { Outlet } from 'react-router-dom';

export default function SecondLayout() {
	return (
		<SecondLayoutWrapper>
			<main>
				<Outlet />
			</main>
		</SecondLayoutWrapper>
	);
}
