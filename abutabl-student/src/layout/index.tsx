import { Fragment, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMutating, useIsFetching } from '@tanstack/react-query';
import { useRecoilState } from 'recoil';
import { isPartiallyLoadingAtom } from '../store';
import LoadingPartially from '../components/loading-partially';

export default function Layout() {
	/* ------------------------------- Global State ------------------------------ */
	const [isPartiallyLoading, setIsPartiallyLoading] = useRecoilState(isPartiallyLoadingAtom);
	const activeQueries = useIsFetching({ stale: false });
	const activeMutations = useIsMutating();

	/* --------------------------------- Effects -------------------------------- */

	useEffect(() => {
		setIsPartiallyLoading(activeQueries > 0 || activeMutations > 0);
	}, [activeQueries, activeMutations, setIsPartiallyLoading]);

	return (
		<Fragment>

			<Suspense >
				<Outlet />
			</Suspense>
		</Fragment>
	);
}
