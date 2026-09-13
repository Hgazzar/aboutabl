import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import inviteOnlyBadge from 'assets/images/figma/landing/invite-only-badge.svg';
import iconBook from 'assets/images/figma/landing/books/icon-book.png';
import iconTree from 'assets/images/figma/landing/books/icon-tree.png';
import iconMath from 'assets/images/figma/landing/books/icon-math.png';
import iconRocket from 'assets/images/figma/landing/books/icon-rocket.svg';
import howLoginIcon from 'assets/images/figma/landing/how-it-works/icon-login.svg';
import howPlayIcon from 'assets/images/figma/landing/how-it-works/icon-play.svg';
import howProgressIcon from 'assets/images/figma/landing/how-it-works/icon-progress.svg';
import founderBees from 'assets/images/figma/landing/founder/bees.png';
import founderQuote from 'assets/images/figma/landing/founder/quote.png';
import founderPhoto from 'assets/images/figma/landing/founder/photo.png';
import contactBird from 'assets/images/figma/landing/contact/bird-tele.png';
import successBird from 'assets/images/figma/landing/contact/success-bird.png';
import { figmaLandingAssetUrl, studentBrandLogoUrl } from 'config/figmaAssets';
import { loginRequest } from 'lib/requests';
import SiteFooter from 'components/site-footer/SiteFooter';
import {
	BookCard,
	BookCardCta,
	BookCardIcon,
	BookCardIcons,
	BookCardPlus,
	BookCardTitle,
	BooksGrid,
	BoardInner,
	Brand,
	BrandMark,
	ContactArea,
	ContactArt,
	ContactBird,
	ContactError,
	ContactField,
	ContactForm,
	ContactGrid,
	ContactHint,
	ContactSection,
	ContactSubmit,
	ContactTitle,
	ContactVisual,
	FounderBio,
	FounderBeesImg,
	FounderCopy,
	FounderGrid,
	FounderHeading,
	FounderHeadingRow,
	FounderPhotoFrame,
	FounderPhotoImg,
	FounderQuote,
	FounderQuoteBlock,
	FounderQuoteMark,
	FounderSection,
	FounderSign,
	HeroArt,
	HeroBand,
	HeroBird,
	HeroCopy,
	HeroCtaRow,
	HeroPrimaryCta,
	HeroSpark,
	HeroSparkClip,
	HeroSubtitle,
	HeroSubtitleLine,
	HeroTitle,
	HeroTitleLine,
	InviteBadge,
	LandingNav,
	LandingNavShell,
	LandingRoot,
	NavLinks,
	NavLogin,
	SectionTitle,
	StepCard,
	StepIconImg,
	StepText,
	StepTitle,
	StepsGrid,
	SuccessBird,
	SuccessBody,
	SuccessCloseBtn,
	SuccessCloseIcon,
	SuccessModal,
	SuccessOverlay,
	SuccessSubtitle,
	SuccessTitle,
	SuccessTop,
	WhiteBoard,
} from './landingStyles';
const BRAND_LOGO = studentBrandLogoUrl();
const HERO_BIRD = figmaLandingAssetUrl('hero-bird.png');
const HERO_SPARK = figmaLandingAssetUrl('hero-spark.png');
const INVITE_BADGE = inviteOnlyBadge;

const POPULAR_BOOKS = [
	{
		key: 'arabic',
		title: 'Arabic',
		gradient: 'linear-gradient(180deg, #F9CE66 9.74%, #F5B00A 100%)',
		secondaryIcon: iconTree,
	},
	{
		key: 'math',
		title: 'Math',
		gradient: 'linear-gradient(180deg, #FD8882 9.74%, #FC5952 90.88%)',
		secondaryIcon: iconMath,
	},
	{
		key: 'science',
		title: 'Science',
		gradient: 'linear-gradient(180deg, #BC8BDD 0%, #984ECB 100%)',
		secondaryIcon: iconRocket,
	},
] as const;

/**
 * Public marketing landing (Figma kFrame-landing).
 * LOGIN / GET STARTED → `/login` (shared Welcome Back form).
 */
export default function Landing() {
	const [contactSending, setContactSending] = useState(false);
	const [contactError, setContactError] = useState<string | null>(null);
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	const closeSuccessModal = () => setShowSuccessModal(false);

	const onContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (contactSending) return;

		const form = event.currentTarget;
		const data = new FormData(form);
		const firstName = String(data.get('firstName') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();

		setContactError(null);
		setContactSending(true);

		try {
			const response = await loginRequest('/contact', {
				first_name: firstName,
				email,
				message,
			});

			if (!response?.status) {
				setContactError(response?.msg || 'Unable to send your message. Please try again.');
				return;
			}

			form.reset();
			setShowSuccessModal(true);
		} catch (err: unknown) {
			const axiosMsg =
				err &&
				typeof err === 'object' &&
				'response' in err &&
				(err as { response?: { data?: { msg?: string } } }).response?.data?.msg;
			setContactError(
				typeof axiosMsg === 'string' && axiosMsg
					? axiosMsg
					: 'Unable to send your message. Please try again.'
			);
		} finally {
			setContactSending(false);
		}
	};

	return (
		<LandingRoot data-testid="public-landing">
			<LandingNavShell>
				<LandingNav aria-label="Main">
					<Brand to="/" aria-label="ABOUTABL">
						<BrandMark src={BRAND_LOGO} alt="ABOUTABL" />
					</Brand>
					<NavLinks>
						<a href="#home" data-active="true">
							Home
						</a>
						<a href="#about">About Us</a>
						<a href="#contact">Contact Us</a>
					</NavLinks>
					<NavLogin to="/login">Login</NavLogin>
				</LandingNav>
			</LandingNavShell>

			<HeroBand id="home">
				<HeroCopy>
					<HeroTitle>
						<HeroTitleLine>Learn & Explore</HeroTitleLine>
						<HeroTitleLine>With Fun!</HeroTitleLine>
					</HeroTitle>
					<HeroSubtitle>
						<HeroSubtitleLine>
							Interactive Arabic, Math, and Science lesson
						</HeroSubtitleLine>
						<HeroSubtitleLine>for kids in UAE and gulf.</HeroSubtitleLine>
					</HeroSubtitle>
					<HeroCtaRow>
						<HeroPrimaryCta to="/login">Get Started</HeroPrimaryCta>
						<InviteBadge src={INVITE_BADGE} alt="Invite Only" decoding="async" />
					</HeroCtaRow>
				</HeroCopy>
				<HeroArt aria-hidden>
					<HeroSparkClip>
						<HeroSpark src={HERO_SPARK} alt="" decoding="async" />
					</HeroSparkClip>
					<HeroBird src={HERO_BIRD} alt="" decoding="async" />
				</HeroArt>
			</HeroBand>

			<WhiteBoard>
				<BoardInner>
					<SectionTitle>Popular Books</SectionTitle>
					<BooksGrid>
						{POPULAR_BOOKS.map((book) => (
							<BookCard key={book.key} to="/login" $gradient={book.gradient}>
								<BookCardIcons aria-hidden>
									<BookCardIcon src={iconBook} alt="" />
									<BookCardPlus>+</BookCardPlus>
									<BookCardIcon
										src={book.secondaryIcon}
										alt=""
										$tall={book.key !== 'arabic'}
										$rotateDeg={book.key === 'science' ? 45 : undefined}
									/>
								</BookCardIcons>
								<BookCardTitle>{book.title}</BookCardTitle>
								<BookCardCta>Start learning</BookCardCta>
							</BookCard>
						))}
					</BooksGrid>

					<SectionTitle>How It Works</SectionTitle>
					<StepsGrid>
						<StepCard>
							<StepIconImg src={howLoginIcon} alt="" decoding="async" />
							<StepTitle>Log In</StepTitle>
							<StepText>Log in with your organization credentials.</StepText>
						</StepCard>
						<StepCard>
							<StepIconImg src={howPlayIcon} alt="" decoding="async" />
							<StepTitle>Play &amp; Learn</StepTitle>
							<StepText>Choose your book and start to play and learn</StepText>
						</StepCard>
						<StepCard>
							<StepIconImg src={howProgressIcon} alt="" decoding="async" />
							<StepTitle>Track Your Progress</StepTitle>
							<StepText>
								Are you a teacher? You can track the progress of your students with ease
							</StepText>
						</StepCard>
					</StepsGrid>

					<section id="about">
						<FounderSection>
							<FounderHeadingRow>
								<FounderHeading>Meet The Founder</FounderHeading>
								<FounderBeesImg src={founderBees} alt="" decoding="async" />
							</FounderHeadingRow>
							<FounderGrid>
								<FounderCopy>
									<FounderBio>
										Dr Aboutabl is an education expert and the founder of ABOUTABL, which
										specializes in creating high-quality educational books. With his extensive
										experience and passion for teaching, along with his team of experts, Dr
										Aboutabl has dedicated himself to inspiring a love of learning in kids through
										engaging and informative books. His contributions to children&apos;s education
										continue to impact young readers.
									</FounderBio>
									<FounderQuoteBlock>
										<FounderQuote>
											<FounderQuoteMark src={founderQuote} alt="" decoding="async" />
											Welcome to our online platform! Our institution is dedicated to providing
											the best possible education by combining the expertise of top-notch teaching
											professionals with the innovative curriculum designed by our experts.
										</FounderQuote>
										<FounderSign>Dr Aboutabl</FounderSign>
									</FounderQuoteBlock>
								</FounderCopy>
								<FounderPhotoFrame>
									<FounderPhotoImg
										src={founderPhoto}
										alt="Dr Aboutabl"
										decoding="async"
									/>
								</FounderPhotoFrame>
							</FounderGrid>
						</FounderSection>
					</section>

					<section id="contact">
						<ContactSection>
							<ContactGrid>
								<ContactVisual>
									<ContactTitle>Contact Us</ContactTitle>
									<ContactHint>
										Have a question or need assistance? Reach out to us via email, phone, or the
										contact form below. We&apos;re eager to assist you.
									</ContactHint>
									<ContactArt aria-hidden>
										<ContactBird src={contactBird} alt="" decoding="async" />
									</ContactArt>
								</ContactVisual>
								<ContactForm onSubmit={onContactSubmit} noValidate>
									<ContactField name="firstName" placeholder="First Name" required />
									<ContactField
										name="email"
										type="email"
										placeholder="Email Address"
										required
									/>
									<ContactArea name="message" placeholder="Message" required />
									{contactError ? <ContactError role="alert">{contactError}</ContactError> : null}
									<ContactSubmit type="submit" disabled={contactSending}>
										{contactSending ? 'Sending…' : 'Submit'}
									</ContactSubmit>
								</ContactForm>
							</ContactGrid>
						</ContactSection>
					</section>
				</BoardInner>
			</WhiteBoard>

			{showSuccessModal ? (
				<SuccessOverlay
					role="presentation"
					onClick={(e) => {
						if (e.target === e.currentTarget) closeSuccessModal();
					}}
				>
					<SuccessModal
						role="dialog"
						aria-modal="true"
						aria-labelledby="contact-success-title"
						data-testid="contact-success-modal"
					>
						<SuccessTop>
							<SuccessCloseIcon type="button" aria-label="Close" onClick={closeSuccessModal}>
								<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
									<path
										d="M1 1l12 12M13 1L1 13"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
									/>
								</svg>
							</SuccessCloseIcon>
							<SuccessBird src={successBird} alt="" decoding="async" />
						</SuccessTop>
						<SuccessBody>
							<SuccessTitle id="contact-success-title">Message Sent Successfully!</SuccessTitle>
							<SuccessSubtitle>We&apos;ll Contact You Soon.</SuccessSubtitle>
							<SuccessCloseBtn type="button" onClick={closeSuccessModal}>
								CLOSE
							</SuccessCloseBtn>
						</SuccessBody>
					</SuccessModal>
				</SuccessOverlay>
			) : null}

			<SiteFooter variant="page" />
		</LandingRoot>
	);
}
