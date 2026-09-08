import { useMemo, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Box, Text, Flex, Button, Loader, Center } from '@mantine/core';
import { useIntl } from 'react-intl';
import {
	useDeleteAllNotificationsMutation,
	useGetNotificationsQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
} from 'redux-toolkit/reducer/notificationsApi';
import {
	countUnreadNotifications,
	formatUnreadBadgeCount,
	isNotificationUnread,
	openNotificationNavTarget,
	type StudentNotificationItem,
} from 'lib/notificationUtils';
import { figmaNavbarAssetUrl } from 'config/figmaAssets';
import { BellButton, NotificationBadge } from './styles';

const BELL_ICON = figmaNavbarAssetUrl('bell.png');
const POLL_MS = 60_000;
const LIST_LIMIT = 10;

type Props = {
	unreadCount?: number;
	onUnreadCountChange?: () => void;
};

export default function NavBarNotifications({ unreadCount = 0, onUnreadCountChange }: Props) {
	const navigate = useNavigate();
	const { formatMessage } = useIntl();
	const { data, isLoading, isError, isFetching } = useGetNotificationsQuery(
		{ limit: LIST_LIMIT },
		{ pollingInterval: POLL_MS }
	);
	const [markRead, markReadState] = useMarkNotificationReadMutation();
	const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();
	const [deleteAll, deleteAllState] = useDeleteAllNotificationsMutation();

	const list = data?.notifications ?? [];
	const listUnreadCount = useMemo(() => countUnreadNotifications(list), [list]);
	const badgeCount = unreadCount > 0 ? unreadCount : listUnreadCount;
	const mutating = markReadState.isLoading || markAllState.isLoading || deleteAllState.isLoading;
	const hasItems = list.length > 0;
	const hasUnread = listUnreadCount > 0 || unreadCount > 0;

	const syncNavbarUnread = () => {
		onUnreadCountChange?.();
	};

	const onItemClick = async (item: StudentNotificationItem) => {
		if (mutating) return;
		const id = Number(item.id);
		if (!Number.isFinite(id) || id <= 0) return;

		try {
			if (isNotificationUnread(item)) {
				await markRead(id).unwrap();
				syncNavbarUnread();
			}
		} catch {
			// Keep dropdown usable; navigation still proceeds for owned deep links.
		}
		openNotificationNavTarget(navigate, item.url);
	};

	const onMarkAllRead = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (mutating || !hasUnread) return;
		try {
			await markAllRead().unwrap();
			syncNavbarUnread();
		} catch {
			// Leave unread state unchanged on failure.
		}
	};

	const onDeleteAll = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (mutating || !hasItems) return;
		const confirmed = window.confirm(formatMessage({ id: 'notifications-clear-confirm' }));
		if (!confirmed) return;
		try {
			await deleteAll().unwrap();
			syncNavbarUnread();
		} catch {
			// Leave list unchanged on failure.
		}
	};

	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<BellButton
					type="button"
					aria-label={formatMessage({ id: 'notifications-bell-label' })}
					disabled={mutating}
				>
					<img src={BELL_ICON} alt="" className="bell-icon" />
					{badgeCount > 0 ? (
						<NotificationBadge aria-hidden>{formatUnreadBadgeCount(badgeCount)}</NotificationBadge>
					) : null}
				</BellButton>
			</Menu.Target>
			<Menu.Dropdown>
				<Box
					sx={{
						maxHeight: 400,
						overflowY: 'auto',
						overflowX: 'hidden',
						padding: 10,
						minWidth: 280,
						maxWidth: 'min(360px, calc(100vw - 24px))',
					}}
				>
					<Flex justify="space-between" align="center" gap={8} mb={8} wrap="wrap">
						<Text size="sm" fw={700}>
							{formatMessage({ id: 'notifications-title' })}
						</Text>
						{hasUnread ? (
							<Button
								variant="subtle"
								compact
								size="xs"
								disabled={mutating}
								loading={markAllState.isLoading}
								onClick={onMarkAllRead}
							>
								{formatMessage({ id: 'notifications-mark-all-read' })}
							</Button>
						) : null}
					</Flex>

					{isLoading && !data ? (
						<Center py="md">
							<Loader size="sm" />
						</Center>
					) : null}

					{isError ? (
						<Text size="sm" c="red" py="xs">
							{formatMessage({ id: 'notifications-error' })}
						</Text>
					) : null}

					{!isLoading && !isError && !hasItems ? (
						<Menu.Label>{formatMessage({ id: 'notifications-empty' })}</Menu.Label>
					) : null}

					{!isError &&
						list.map((item) => {
							const unread = isNotificationUnread(item);
							return (
								<Menu.Item
									key={String(item.id)}
									disabled={mutating}
									onClick={() => {
										void onItemClick(item);
									}}
									style={{
										background: unread ? '#f2f2f2' : undefined,
										marginBottom: 8,
										borderRadius: 8,
										opacity: mutating ? 0.7 : 1,
									}}
								>
									<Flex direction="column" gap={2} maw="100%">
										<Text size="sm" fw={unread ? 700 : 600} lineClamp={2} style={{ wordBreak: 'break-word' }}>
											{item.title}
										</Text>
										{item.description ? (
											<Text size="xs" c="dimmed" lineClamp={3} style={{ wordBreak: 'break-word' }}>
												{item.description}
											</Text>
										) : null}
									</Flex>
								</Menu.Item>
							);
						})}

					{isFetching && data && !mutating ? (
						<Text size="xs" c="dimmed" ta="center" mt={4}>
							{formatMessage({ id: 'notifications-refreshing' })}
						</Text>
					) : null}
				</Box>

				{hasItems ? (
					<Menu.Item color="red" disabled={mutating} onClick={onDeleteAll}>
						{formatMessage({ id: 'notifications-clear-all' })}
					</Menu.Item>
				) : null}
			</Menu.Dropdown>
		</Menu>
	);
}
