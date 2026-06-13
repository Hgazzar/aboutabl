import Header from 'layout/header';
import SideBar from 'layout/side-bar';
import { LayoutContainer, LayoutWrapper } from 'layout/styles';
import { Route, Routes } from 'react-router-dom';
import { useRoutesConst } from 'routes';
import NoMatch from 'views/NoMatch';

export default function MainLayout() {
	const { ROUTES } = useRoutesConst();
	return (
		<LayoutWrapper>
			<SideBar />
			<LayoutContainer>
				<Header />
				<main>
					<Routes>
						<Route path={ROUTES.learn.path} element={ROUTES.learn.component} />

						<Route path={ROUTES.profile.path} element={ROUTES.profile.component} />

						<Route path={ROUTES.support.path} element={ROUTES.support.component} />

						<Route path="*" element={<NoMatch />} />
					</Routes>
				</main>
			</LayoutContainer>
		</LayoutWrapper>
	);
}
