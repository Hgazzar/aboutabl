import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import HelloQuickActions from './HelloQuickActions';
import en from 'translations/EN/translation.json';

vi.mock('lib/studentAvatar', () => ({
	resolveCurrentStudentAvatarSrc: () => '/avatar.png',
}));

function LocationProbe() {
	const location = useLocation();
	return <div data-testid="location-path">{location.pathname}</div>;
}

function renderActions() {
	return render(
		<IntlProvider locale="en" messages={en as Record<string, string>}>
			<MemoryRouter initialEntries={['/learn']}>
				<Routes>
					<Route
						path="/learn"
						element={
							<>
								<HelloQuickActions
									studentName="Sam"
									photoUrl={null}
									newAssignmentsCount={0}
								/>
								<LocationProbe />
							</>
						}
					/>
					<Route
						path="/live-games"
						element={
							<>
								<div data-testid="my-live-games-route">live games</div>
								<LocationProbe />
							</>
						}
					/>
					<Route
						path="/todo"
						element={
							<>
								<div data-testid="todo-route">todo</div>
								<LocationProbe />
							</>
						}
					/>
					<Route
						path="/learn/books"
						element={
							<>
								<div data-testid="books-route">books</div>
								<LocationProbe />
							</>
						}
					/>
				</Routes>
			</MemoryRouter>
		</IntlProvider>
	);
}

describe('HelloQuickActions Play Game', () => {
	afterEach(() => {
		cleanup();
	});

	it('navigates Play Game to /live-games', async () => {
		renderActions();
		const play = screen.getByTestId('dashboard-play-game');
		expect(play.hasAttribute('disabled')).toBe(false);
		await userEvent.click(play);
		expect(screen.getByTestId('my-live-games-route')).toBeTruthy();
		expect(screen.getByTestId('location-path').textContent).toBe('/live-games');
	});

	it('preserves other quick actions', async () => {
		renderActions();
		await userEvent.click(screen.getByRole('link', { name: /view assignments/i }));
		expect(screen.getByTestId('todo-route')).toBeTruthy();
	});
});
