import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from 'assets/images/svg/notification.svg?react';
import {
	useDeleteAllNotificationsMutation,
	useGetNotificationsQuery,
	useMarkNotificationReadMutation,
} from 'redux-toolkit/reducer/notificationsApi';
import {
	countUnreadNotifications,
	isNotificationUnread,
	openNotificationNavTarget,
	type StudentNotificationItem,
} from 'lib/notificationUtils';
import { Menu, Avatar, Box, Text, Button, Flex, Loader, Center } from '@mantine/core';
import { useIntl } from 'react-intl';

/**
 * Legacy Learn/Games page-header bell.
 * Shares RTK notification cache with navbar — kept for pages that still render PageHeader.
 * Primary Student inbox UX is NavBarNotifications (Phase 3).
 */
const NotificationDropdown = () => {
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const { data, error, isLoading } = useGetNotificationsQuery(
		{ limit: 10 },
		{ pollingInterval: 60_000 }
	);
	const [markRead, markReadState] = useMarkNotificationReadMutation();
	const [deleteAll, deleteAllState] = useDeleteAllNotificationsMutation();

	const list = data?.notifications ?? [];
	const unreadCount = useMemo(() => countUnreadNotifications(list), [list]);
	const mutating = markReadState.isLoading || deleteAllState.isLoading;

	const onItemClick = async (item: StudentNotificationItem) => {
		if (mutating) return;
		const id = Number(item.id);
		if (!Number.isFinite(id) || id <= 0) return;
		try {
			if (isNotificationUnread(item)) {
				await markRead(id).unwrap();
			}
		} catch {
			// ignore — still attempt navigation
		}
		openNotificationNavTarget(navigate, item.url);
	};

	const onDeleteAll = async () => {
		if (mutating || list.length === 0) return;
		const confirmed = window.confirm(formatMessage({ id: 'notifications-clear-confirm' }));
		if (!confirmed) return;
		try {
			await deleteAll().unwrap();
		} catch {
			// leave list as-is
		}
	};

	return (
		<Menu>
			<Menu.Target>
				<Button variant="" aria-label={formatMessage({ id: 'notifications-bell-label' })}>
					<Flex align="center" justify="center" className="notification platinum_shadow" style={{ position: 'relative' }}>
						<Notification />
						{unreadCount > 0 && (
							<Box
								className="notification-unread-badge"
								aria-hidden
								style={{
									position: 'absolute',
									top: 2,
									insetInlineEnd: 2,
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
				<Box style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'hidden', padding: '10px', maxWidth: 'min(360px, calc(100vw - 24px))' }}>
					{isLoading && !data ? (
						<Center py="md">
							<Loader size="sm" />
						</Center>
					) : null}

					{error ? (
						<Text size="sm" color="red">
							{formatMessage({ id: 'notifications-error' })}
						</Text>
					) : null}

					{!isLoading && !error && list.length === 0 ? (
						<Menu.Label>{formatMessage({ id: 'notifications-empty' })}</Menu.Label>
					) : null}

					{!error &&
						list.map((item) => (
							<Menu.Item
								key={String(item.id)}
								disabled={mutating}
								onClick={() => {
									void onItemClick(item);
								}}
								style={{ background: isNotificationUnread(item) ? '#eee' : '', marginBottom: '10px' }}
							>
								<Flex align="center" gap={10} maw="100%">
									{item?.photo ? <Avatar src={item.photo} size={30} radius="xl" /> : null}
									<Box style={{ minWidth: 0, flex: 1 }}>
										<Text lineClamp={2} style={{ wordBreak: 'break-word' }}>
											{item?.title}
										</Text>
										{item?.description ? (
											<Text size="sm" color="dimmed" lineClamp={3} style={{ wordBreak: 'break-word' }}>
												{item.description}
											</Text>
										) : null}
									</Box>
								</Flex>
							</Menu.Item>
						))}
				</Box>

				{list.length > 0 ? (
					<Menu.Item disabled={mutating} onClick={() => void onDeleteAll()}>
						<Text color="red">{formatMessage({ id: 'notifications-clear-all' })}</Text>
					</Menu.Item>
				) : null}
			</Menu.Dropdown>
		</Menu>
	);
};

export default NotificationDropdown;
