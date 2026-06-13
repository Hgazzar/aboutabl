import { FC } from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute: FC<{ children: JSX.Element }> = ({ children }) => {
	if (!Cookies.get('token_')) {
		return <Navigate to="/login" replace />;
	}
	return children;
};

export default ProtectedRoute;
