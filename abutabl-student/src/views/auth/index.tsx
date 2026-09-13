import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import LoadingPartially from 'components/loading-partially';
import SiteFooter from 'components/site-footer/SiteFooter';
import { AuthPageRoot, AuthMain, AuthCard } from './authShellStyles';

export default function AuthSections() {
	return (
		<AuthPageRoot>
			<AuthMain>
				<AuthCard>
					<Suspense fallback={<LoadingPartially />}>
						<Outlet />
					</Suspense>
				</AuthCard>
			</AuthMain>
			<SiteFooter variant="page" />
		</AuthPageRoot>
	);
}
