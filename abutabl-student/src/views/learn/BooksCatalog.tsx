import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import LoadingPartially from 'components/loading-partially';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import {
	fetchStudentMyProgress,
	type MyProgressPayload,
} from 'lib/myProgressApi';
import { getApiErrorMessage } from 'lib/studentApiResponse';
import { useDashboardData } from 'views/dashboard/useDashboardData';
import MyBooksAdventureCard from './myBooks/MyBooksAdventureCard';
import MyBooksHero from './myBooks/MyBooksHero';
import {
	resolveMyBooksHeroBook,
} from './myBooks/myBooksPageState';
import {
	AdventureGrid,
	AdventureHeading,
	AdventureSection,
	BooksBoard,
	BooksEmptyHint,
	BooksErrorBanner,
	BooksMain,
	BooksPage,
} from './myBooks/myBooksStyles';

const SPARK = figmaDashboardAssetUrl('star-6-1.svg');

/** kFrame-MyBooks — Books catalog at `/learn/books` (evolved BooksCatalog). */
export default function BooksCatalog() {
	const { formatMessage } = useIntl();
	const {
		data: dashboard,
		initialLoading: dashboardLoading,
		error: dashboardError,
		retry: retryDashboard,
	} = useDashboardData('week');

	const [progress, setProgress] = useState<MyProgressPayload | null>(null);
	const [progressLoading, setProgressLoading] = useState(true);
	const [progressError, setProgressError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		setProgressLoading(true);

		fetchStudentMyProgress(controller.signal)
			.then((payload) => {
				if (controller.signal.aborted) return;
				setProgress(payload);
				setProgressError(null);
			})
			.catch((err) => {
				if (controller.signal.aborted) return;
				setProgress(null);
				setProgressError(
					getApiErrorMessage(err, formatMessage({ id: 'my-books-load-error' }))
				);
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setProgressLoading(false);
				}
			});

		return () => controller.abort();
	}, [formatMessage, reloadKey]);

	const retry = () => {
		setReloadKey((k) => k + 1);
		retryDashboard();
	};

	const books = progress?.books ?? [];
	const continueLearning = dashboard?.continue_learning;
	const heroBook = useMemo(
		() => resolveMyBooksHeroBook(books, continueLearning),
		[books, continueLearning]
	);

	const initialLoading =
		(progressLoading && !progress) || (dashboardLoading && !dashboard);

	if (initialLoading) {
		return (
			<BooksPage>
				<BooksMain>
					<LoadingPartially />
				</BooksMain>
			</BooksPage>
		);
	}

	if (!progress) {
		return (
			<BooksPage>
				<BooksMain>
					<BooksEmptyHint>
						{progressError ?? formatMessage({ id: 'my-books-load-error' })}
						{progressError ? (
							<>
								{' '}
								<button type="button" onClick={retry}>
									{formatMessage({ id: 'dashboard-retry' })}
								</button>
							</>
						) : null}
					</BooksEmptyHint>
				</BooksMain>
			</BooksPage>
		);
	}

	const surfaceError = progressError || dashboardError;

	return (
		<BooksPage data-testid="my-books-page">
			<BooksMain>
				{surfaceError ? (
					<BooksErrorBanner role="alert">
						<span>{surfaceError}</span>
						<button type="button" onClick={retry}>
							{formatMessage({ id: 'dashboard-retry' })}
						</button>
					</BooksErrorBanner>
				) : null}

				<BooksBoard>
					<MyBooksHero
						heroBook={heroBook}
						continueLearning={continueLearning}
						studentName={progress.hero.name}
					/>

					<AdventureSection aria-labelledby="my-books-adventure-heading">
						<AdventureHeading id="my-books-adventure-heading">
							<img src={SPARK} alt="" aria-hidden />
							{formatMessage({ id: 'my-books-pick-adventure' })}
							<img src={SPARK} alt="" aria-hidden />
						</AdventureHeading>

						{books.length === 0 ? (
							<p>{formatMessage({ id: 'my-progress-books-empty' })}</p>
						) : (
							<AdventureGrid>
								{books.map((book, index) => (
									<MyBooksAdventureCard
										key={book.subject_id}
										book={book}
										index={index}
									/>
								))}
							</AdventureGrid>
						)}
					</AdventureSection>
				</BooksBoard>
			</BooksMain>
		</BooksPage>
	);
}
