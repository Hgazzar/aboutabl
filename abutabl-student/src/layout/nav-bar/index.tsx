import { useEffect, useRef, useState } from 'react';
import Menu from 'assets/images/svg/menu.svg?react';
import Close from 'assets/images/svg/close.svg?react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { isSideBarOpenAtom } from 'store/is-sidebarOpen';
import {
	ActionsCluster,
	AvatarWrap,
	BrandLink,
	LogoutButton,
	MobileMenuButton,
	NavBarInner,
	NavBarRoot,
	NavBarStart,
	SearchField,
	SearchIconWrap,
	SearchResults,
	SearchShell,
	SearchWrap,
	XpCounter,
} from './styles';
import SearchIcon from 'assets/images/svg/search.svg?react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { logout } from 'redux-toolkit/reducer/LogputReducer';
import { useNavigate } from 'react-router-dom';
import { searchStudentContent, type DashboardSearchResult } from 'lib/dashboardApi';
import { fetchStudentNavbar, type NavbarPayload } from 'lib/navbarApi';
import { figmaNavbarAssetUrl, studentBrandLogoUrl } from 'config/figmaAssets';
import {
	ensureDefaultStudentAvatarStored,
	resolveCurrentStudentAvatarSrc,
	syncStoredStudentPhotoUrl,
} from 'lib/studentAvatar';
import NavBarNotifications from './NavBarNotifications';

const LOGO = studentBrandLogoUrl();
const STAR = figmaNavbarAssetUrl('star-6-1.png');

function applyNavbarPayload(payload: NavbarPayload | null): NavbarPayload | null {
	if (payload?.student) {
		syncStoredStudentPhotoUrl(payload.student.photo_url ?? null);
	}
	return payload;
}

export default function NavBar() {
	const { formatMessage } = useIntl();
	const isSideBarOpen = useRecoilValue(isSideBarOpenAtom);
	const setSidebarOpen = useSetRecoilState(isSideBarOpenAtom);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [navbarData, setNavbarData] = useState<NavbarPayload | null>(null);
	const [avatarTick, setAvatarTick] = useState(0);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<DashboardSearchResult[]>([]);
	const [searchOpen, setSearchOpen] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		ensureDefaultStudentAvatarStored();
		const onAvatarUpdated = () => setAvatarTick((n) => n + 1);
		window.addEventListener('student-avatar-updated', onAvatarUpdated);
		return () => window.removeEventListener('student-avatar-updated', onAvatarUpdated);
	}, []);

	useEffect(() => {
		fetchStudentNavbar()
			.then((payload) => setNavbarData(applyNavbarPayload(payload)))
			.catch(() => setNavbarData(null));
	}, [avatarTick]);

	const refreshNavbar = () => {
		fetchStudentNavbar()
			.then((payload) => setNavbarData(applyNavbarPayload(payload)))
			.catch(() => setNavbarData(null));
	};

	useEffect(() => {
		const term = query.trim();
		if (term.length < 2) {
			setResults([]);
			setSearchOpen(false);
			return undefined;
		}

		const timer = window.setTimeout(() => {
			searchStudentContent(term, 8)
				.then((items) => {
					setResults(items);
					setSearchOpen(true);
				})
				.catch(() => {
					setResults([]);
					setSearchOpen(false);
				});
		}, 300);

		return () => window.clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		const onDocClick = (event: MouseEvent) => {
			if (!searchRef.current?.contains(event.target as Node)) {
				setSearchOpen(false);
			}
		};
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	}, []);

	const onLogout = async () => {
		await dispatch(logout({}));
		navigate('/login');
	};

	const onSelectResult = (item: DashboardSearchResult) => {
		setQuery('');
		setResults([]);
		setSearchOpen(false);
		if (item.path) navigate(item.path);
	};

	const avatarSrc = resolveCurrentStudentAvatarSrc(
		navbarData === null ? undefined : navbarData.student?.photo_url ?? null
	);
	const totalXp = navbarData?.xp?.total_xp ?? 0;

	const onAvatarClick = () => {
		navigate('/profile');
	};

	return (
		<NavBarRoot>
			<NavBarInner>
				<NavBarStart>
					<MobileMenuButton
						type="button"
						aria-label={isSideBarOpen ? 'Close menu' : 'Open menu'}
						onClick={() => setSidebarOpen(!isSideBarOpen)}
					>
						{isSideBarOpen ? <Close /> : <Menu />}
					</MobileMenuButton>

					<BrandLink to="/learn" aria-label="ABOUTABL">
						<img src={LOGO} alt="ABOUTABL" />
					</BrandLink>
				</NavBarStart>

				<SearchWrap ref={searchRef}>
					<SearchShell>
						<SearchIconWrap aria-hidden>
							<SearchIcon />
						</SearchIconWrap>
						<SearchField
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={formatMessage({ id: 'navbar-search-placeholder' })}
							onFocus={() => {
								if (results.length > 0) setSearchOpen(true);
							}}
						/>
					</SearchShell>
					{searchOpen && query.trim().length >= 2 && (
						<SearchResults>
							{results.length === 0 ? (
								<p>{formatMessage({ id: 'dashboard-search-empty' })}</p>
							) : (
								results.map((item) => (
									<button
										key={`${item.kind}-${item.id}`}
										type="button"
										onClick={() => onSelectResult(item)}
									>
										<strong>{item.title}</strong>
										<span>{item.kind}</span>
									</button>
								))
							)}
						</SearchResults>
					)}
				</SearchWrap>

				<ActionsCluster>
					<XpCounter aria-label={`${totalXp} XP`}>
						<img src={STAR} alt="" />
						<strong>{totalXp}XP</strong>
					</XpCounter>

					<NavBarNotifications
						unreadCount={navbarData?.notifications?.unread_count ?? 0}
						onUnreadCountChange={refreshNavbar}
					/>

					<AvatarWrap
						type="button"
						aria-label={formatMessage({ id: 'Profile' })}
						onClick={onAvatarClick}
					>
						<img src={avatarSrc} alt="" className="avatar" />
					</AvatarWrap>

					<LogoutButton type="button" onClick={onLogout}>
						{formatMessage({ id: 'navbar-logout' })}
					</LogoutButton>
				</ActionsCluster>
			</NavBarInner>
		</NavBarRoot>
	);
}
