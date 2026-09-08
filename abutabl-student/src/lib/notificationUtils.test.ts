import { describe, expect, it, vi, afterEach } from 'vitest';
import {
	countUnreadNotifications,
	formatUnreadBadgeCount,
	isNotificationUnread,
	openNotificationNavTarget,
	resolveNotificationNavTarget,
} from './notificationUtils';

describe('notificationUtils', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('detects unread for string/number/boolean is_read', () => {
		expect(isNotificationUnread({ is_read: '0' })).toBe(true);
		expect(isNotificationUnread({ is_read: 0 })).toBe(true);
		expect(isNotificationUnread({ is_read: false })).toBe(true);
		expect(isNotificationUnread({ is_read: '1' })).toBe(false);
		expect(isNotificationUnread({ is_read: 1 })).toBe(false);
		expect(isNotificationUnread({ is_read: true })).toBe(false);
	});

	it('counts unread items', () => {
		expect(
			countUnreadNotifications([
				{ is_read: '0' },
				{ is_read: '1' },
				{ is_read: 0 },
			])
		).toBe(2);
		expect(countUnreadNotifications([])).toBe(0);
		expect(countUnreadNotifications(undefined)).toBe(0);
	});

	it('formats badge count', () => {
		expect(formatUnreadBadgeCount(3)).toBe('3');
		expect(formatUnreadBadgeCount(100)).toBe('99+');
	});

	it('classifies internal relative paths', () => {
		expect(resolveNotificationNavTarget('/todo')).toEqual({ kind: 'internal', path: '/todo' });
		expect(resolveNotificationNavTarget('learn/5/quiz/9')).toEqual({
			kind: 'internal',
			path: '/learn/5/quiz/9',
		});
		expect(resolveNotificationNavTarget('/subjects/quiz/123')).toEqual({
			kind: 'internal',
			path: '/subjects/quiz/123',
		});
	});

	it('classifies external absolute URLs', () => {
		expect(resolveNotificationNavTarget('https://example.com/help')).toEqual({
			kind: 'external',
			href: 'https://example.com/help',
		});
	});

	it('treats protocol-relative URLs as external https (no SPA open-redirect)', () => {
		expect(resolveNotificationNavTarget('//evil.example/phish')).toEqual({
			kind: 'external',
			href: 'https://evil.example/phish',
		});
	});

	it('ignores dangerous schemes and empty urls', () => {
		expect(resolveNotificationNavTarget('javascript:alert(1)')).toEqual({ kind: 'none' });
		expect(resolveNotificationNavTarget(null)).toEqual({ kind: 'none' });
		expect(resolveNotificationNavTarget('')).toEqual({ kind: 'none' });
		expect(resolveNotificationNavTarget('null')).toEqual({ kind: 'none' });
	});

	it('navigates internal and opens external safely', () => {
		const navigate = vi.fn();
		const open = vi.fn(() => null);
		vi.stubGlobal('window', {
			location: { origin: 'http://localhost:5173' },
			open,
		});

		openNotificationNavTarget(navigate, '/todo');
		expect(navigate).toHaveBeenCalledWith('/todo');
		expect(open).not.toHaveBeenCalled();

		openNotificationNavTarget(navigate, 'https://example.com/x');
		expect(open).toHaveBeenCalledWith('https://example.com/x', '_blank', 'noopener,noreferrer');
	});
});
