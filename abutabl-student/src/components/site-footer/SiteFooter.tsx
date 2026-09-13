import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import {
	SiteFooterCopy,
	SiteFooterInner,
	SiteFooterLinks,
	SiteFooterRoot,
	SiteFooterSocial,
	SiteFooterSocialLink,
} from './styles';

type SiteFooterProps = {
	/** `page` = full-bleed (landing). `shell` = inside authenticated green shell. */
	variant?: 'page' | 'shell';
};

function FacebookIcon() {
	return (
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
			<path
				fill="currentColor"
				d="M14 8.5h2.2V6h-2.2C12.1 6 11 7.2 11 9v1.5H9.2V13H11v7h2.5v-7H16l.4-2.5H13.5V9.2c0-.4.3-.7.7-.7z"
			/>
		</svg>
	);
}

function WhatsAppIcon() {
	return (
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
			<path
				fill="currentColor"
				d="M12.04 4.5c-4.1 0-7.45 3.3-7.45 7.36 0 1.3.34 2.55.99 3.66L4.5 19.5l4.12-1.05a7.5 7.5 0 0 0 3.42.82c4.1 0 7.45-3.3 7.45-7.36S16.14 4.5 12.04 4.5zm0 13.4c-1.1 0-2.18-.29-3.12-.84l-.22-.13-2.45.63.65-2.35-.14-.23a5.9 5.9 0 0 1-.9-3.12c0-3.27 2.7-5.93 6.18-5.93s6.18 2.66 6.18 5.93-2.7 5.94-6.18 5.94zm3.4-4.44c-.19-.1-1.1-.54-1.27-.6-.17-.06-.3-.1-.42.1-.12.19-.48.6-.59.72-.11.12-.22.14-.41.05-.19-.1-.8-.29-1.52-.93-.56-.5-.94-1.11-1.05-1.3-.11-.19-.01-.29.08-.39.09-.09.19-.22.29-.33.1-.11.13-.19.19-.32.06-.12.03-.24-.02-.33-.05-.1-.42-1-.58-1.37-.15-.36-.31-.31-.42-.31h-.36c-.12 0-.33.05-.5.24-.17.19-.66.64-.66 1.56s.68 1.81.77 1.93c.1.12 1.34 2.04 3.25 2.86.45.2.81.31 1.09.4.46.14.87.12 1.2.07.37-.05 1.1-.45 1.26-.88.15-.43.15-.8.11-.88-.05-.07-.17-.12-.36-.22z"
			/>
		</svg>
	);
}

function InstagramIcon() {
	return (
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
			<path
				fill="currentColor"
				d="M12 7.8A4.2 4.2 0 1 0 12 16.2 4.2 4.2 0 0 0 12 7.8zm0 6.9A2.7 2.7 0 1 1 12 9.3a2.7 2.7 0 0 1 0 5.4zm5.35-7.05a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 4.5c-2.05 0-2.3.01-3.11.05-.8.04-1.35.17-1.83.36a3.7 3.7 0 0 0-1.34.87 3.7 3.7 0 0 0-.87 1.34c-.19.48-.32 1.03-.36 1.83C4.51 9.7 4.5 9.95 4.5 12s.01 2.3.05 3.11c.04.8.17 1.35.36 1.83.2.5.46.93.87 1.34.41.41.84.67 1.34.87.48.19 1.03.32 1.83.36.81.04 1.06.05 3.11.05s2.3-.01 3.11-.05c.8-.04 1.35-.17 1.83-.36a3.7 3.7 0 0 0 1.34-.87 3.7 3.7 0 0 0 .87-1.34c.19-.48.32-1.03.36-1.83.04-.81.05-1.06.05-3.11s-.01-2.3-.05-3.11c-.04-.8-.17-1.35-.36-1.83a3.7 3.7 0 0 0-.87-1.34 3.7 3.7 0 0 0-1.34-.87c-.48-.19-1.03-.32-1.83-.36C14.3 4.51 14.05 4.5 12 4.5zm0 1.5c2.01 0 2.25.01 3.04.05.73.03 1.13.16 1.4.26.35.14.6.3.86.56.26.26.42.51.56.86.1.27.23.67.26 1.4.04.79.05 1.03.05 3.04s-.01 2.25-.05 3.04c-.03.73-.16 1.13-.26 1.4-.14.35-.3.6-.56.86-.26.26-.51.42-.86.56-.27.1-.67.23-1.4.26-.79.04-1.03.05-3.04.05s-2.25-.01-3.04-.05c-.73-.03-1.13-.16-1.4-.26a2.2 2.2 0 0 1-.86-.56 2.2 2.2 0 0 1-.56-.86c-.1-.27-.23-.67-.26-1.4C6.01 14.25 6 14.01 6 12s.01-2.25.05-3.04c.03-.73.16-1.13.26-1.4.14-.35.3-.6.56-.86.26-.26.51-.42.86-.56.27-.1.67-.23 1.4-.26C9.75 6.01 9.99 6 12 6z"
			/>
		</svg>
	);
}

/**
 * Shared ABOUTABL footer (Figma): links + social + copyright.
 * Used on landing and all authenticated student shell screens.
 */
export default function SiteFooter({ variant = 'shell' }: SiteFooterProps) {
	const { formatMessage } = useIntl();

	return (
		<SiteFooterRoot $variant={variant} data-testid="site-footer">
			<SiteFooterInner>
				<SiteFooterLinks>
					<Link to="/#about">{formatMessage({ id: 'footer-about' })}</Link>
					<Link to="/#contact">{formatMessage({ id: 'footer-contact' })}</Link>
					<a href="#terms">{formatMessage({ id: 'footer-terms' })}</a>
					<a href="#privacy">{formatMessage({ id: 'footer-privacy' })}</a>
				</SiteFooterLinks>

				<SiteFooterSocial aria-label={formatMessage({ id: 'footer-social' })}>
					<SiteFooterSocialLink
						href="https://www.facebook.com/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Facebook"
					>
						<FacebookIcon />
					</SiteFooterSocialLink>
					<SiteFooterSocialLink
						href="https://wa.me/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="WhatsApp"
					>
						<WhatsAppIcon />
					</SiteFooterSocialLink>
					<SiteFooterSocialLink
						href="https://www.instagram.com/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Instagram"
					>
						<InstagramIcon />
					</SiteFooterSocialLink>
				</SiteFooterSocial>

				<SiteFooterCopy>{formatMessage({ id: 'dashboard-footer-copy' })}</SiteFooterCopy>
			</SiteFooterInner>
		</SiteFooterRoot>
	);
}
