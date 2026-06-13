import SideBar from 'layout/side-bar';
import Header from 'layout/header';
import { LayoutWrapper, LayoutContainer } from 'layout/styles';
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingPartially from 'components/loading-partially';

export default function Home() {
	return (
		<LayoutWrapper>
			<SideBar />
			<LayoutContainer>
				<Header />
				<main>
					<Suspense >
						<Outlet />
					</Suspense>
				</main>
			</LayoutContainer>
		</LayoutWrapper>
	);
}
