import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';
import { studentNeedsAvatarSelection } from 'lib/studentAvatar';
import Landing from './index';

/**
 * Public `/` entry: landing for guests; signed-in students go to `/learn`.
 * Does not change ProtectedRoute deep-link behavior (`/learn` → `/login`).
 */
export default function PublicHome() {
	if (Cookies.get('token_')) {
		if (studentNeedsAvatarSelection()) {
			return <Navigate to="/onboarding/avatar" replace />;
		}
		return <Navigate to="/learn" replace />;
	}
	return <Landing />;
}
