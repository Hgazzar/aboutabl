import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from 'assets/images/svg/notification.svg?react';
import { useGetNotificationsQuery } from 'redux-toolkit/reducer/notificationsApi';
import { deleteRequest, postRequest } from 'lib/requests';
import { Menu, Avatar, Box, Text, Button, Flex } from '@mantine/core';

function isUnread(item: { is_read?: string | number | boolean }) {
	return item?.is_read === '0' || item?.is_read === 0 || item?.is_read === false;
}

function openNotificationTarget(navigate: ReturnType<typeof useNavigate>, rawUrl: string | null | undefined) {
	if (rawUrl == null || rawUrl === '') return;
	const url = String(rawUrl).trim();
	if (!url || url === 'null' || url === 'undefined') return;

	try {
		if (/^https?:\/\//i.test(url)) {
			const parsed = new URL(url);
			if (parsed.origin === window.location.origin) {
				navigate(`${parsed.pathname}${parsed.search}${parsed.hash}`);
			} else {
				window.open(url, '_blank', 'noopener,noreferrer');
			}
			return;
		}
		const path = url.startsWith('/') ? url : `/${url}`;
		navigate(path);
	} catch {
		// ignore malformed URLs
	}
}

const NotificationDropdown = () => {
	const navigate = useNavigate();
	const { data, error, isLoading, refetch } = useGetNotificationsQuery<any>(
		{
			limit: 10,
		},
		{ pollingInterval: 60000 }
	);

	const unreadCount = useMemo(() => {
		const list = data?.notifications ?? [];
		return list.filter((n: any) => isUnread(n)).length;
	}, [data?.notifications]);

	const readingNotify = async (id: number) => {
		await postRequest(`notifications/update_read/${id}`);
	};

	const deleteNotify = async () => {
		await deleteRequest(`notifications/delete_all`);
		refetch();
	};

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error loading notifications</div>;

	return (
		<Menu>
			<Menu.Target>
				<Button variant="">
					<Flex align="center" justify="center" className="notification platinum_shadow" style={{ position: 'relative' }}>
						<Notification />
						{unreadCount > 0 && (
							<Box
								className="notification-unread-badge"
								style={{
									position: 'absolute',
									top: 2,
									right: 2,
									width: 10,
									height: 10,
									borderRadius: '50%',
									backgroundColor: '#e03131',
									boxShadow: '0 0 0 2px #fff',
								}}
							/>
						)}
					</Flex>
				</Button>
			</Menu.Target>

			<Menu.Dropdown>
				<Box style={{ maxHeight: 400, overflowY: 'auto', padding: '10px' }}>
					{data?.notifications?.length > 0 ? (
						data?.notifications?.map((item: any, index: number) => (
							<Menu.Item
								key={index}
								onClick={() => {
									void readingNotify(+item?.id);
									openNotificationTarget(navigate, item?.url);
								}}
								style={{ background: isUnread(item) ? '#eee' : '', marginBottom: '10px' }}
							>
								<Flex align="center">
									{item?.photo && <Avatar src={item?.photo} size={30} radius="xl" style={{ marginRight: '10px' }} />}
									<Box>
										<Text>{item?.title}</Text>
										<Text size="sm" color="dimmed">
											{item?.description}
										</Text>
									</Box>
								</Flex>
							</Menu.Item>
						))
					) : (
						<Menu.Label>No notifications found</Menu.Label>
					)}
				</Box>

				{data?.notifications?.length > 0 && (
					<Menu.Item onClick={() => deleteNotify()}>
						<Text color="red">Clear All Notifications</Text>
					</Menu.Item>
				)}
			</Menu.Dropdown>
		</Menu>
	);
};

export default NotificationDropdown;
