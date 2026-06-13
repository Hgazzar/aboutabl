import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const WithGuard =
    (
        Component: React.ComponentType<{ permission: { [key: string]: boolean } }>,
    ) =>
        ({ ...props }) => {
            const token = true;

            const permission: { [key: string]: boolean } = {
                canWrite: true,
                canRead: true,
                canDelete: false,
            };
            return token ? (
                <Component {...props} permission={permission} />
            ) : (
                <Navigate to='/login' />
            );
        };

export default WithGuard;
