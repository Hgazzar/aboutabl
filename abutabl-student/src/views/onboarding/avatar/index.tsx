import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Cookies from 'js-cookie';
import { postRequest } from 'lib/requests';
import { studentBrandLogoUrl } from 'config/figmaAssets';
import {
	STUDENT_AVATAR_PRESETS,
	markStudentAvatarOnboardingComplete,
	resolveStudentAvatarPresetUrl,
} from 'lib/studentAvatar';
import {
	AvatarCard,
	AvatarFace,
	AvatarGrid,
	BrandMark,
	ChangeBeside,
	ErrorText,
	GhostBtn,
	GreatChoice,
	HeroTitle,
	HeroAccent,
	HomeBtn,
	OnboardingRoot,
	PageShell,
	Panel,
	PreviewCard,
	PreviewFace,
	PreviewStage,
	SelectBtn,
	StartBtn,
	SuccessWrap,
	HeaderGrid,
	HeaderLeft,
	HeaderCenter,
	LogoSlot,
} from './styles';

const LOGO = studentBrandLogoUrl();

type Step = 'pick' | 'success';

export default function AvatarOnboarding() {
	const { formatMessage } = useIntl();
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>('pick');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const html = document.documentElement;
		const body = document.body;
		const prevHtmlBg = html.style.backgroundColor;
		const prevBodyBg = body.style.backgroundColor;
		html.style.backgroundColor = '#ffffff';
		body.style.backgroundColor = '#ffffff';
		return () => {
			html.style.backgroundColor = prevHtmlBg;
			body.style.backgroundColor = prevBodyBg;
		};
	}, []);

	const clearSessionAndGoHome = () => {
		Cookies.remove('token_');
		Cookies.remove('username');
		Cookies.remove('abotable_id');
		Cookies.remove('expiration');
		localStorage.removeItem('user_info');
		navigate('/', { replace: true });
	};

	const onSelect = async (presetId: string) => {
		if (saving) return;
		setSaving(true);
		setError(null);
		try {
			const res = await postRequest('avatar/select', { avatar_preset: presetId });
			if (!res?.status) {
				throw new Error(res?.msg || 'Failed to save avatar');
			}
			markStudentAvatarOnboardingComplete(presetId);
			setSelectedId(presetId);
			setStep('success');
		} catch (e: unknown) {
			const ax = e as { response?: { data?: { msg?: string } }; message?: string };
			setError(
				ax?.response?.data?.msg ||
					ax?.message ||
					formatMessage({ id: 'avatar-onboarding-error' })
			);
		} finally {
			setSaving(false);
		}
	};

	const previewUrl = resolveStudentAvatarPresetUrl(selectedId) ?? STUDENT_AVATAR_PRESETS[0].url;

	if (step === 'success') {
		return (
			<OnboardingRoot data-testid="avatar-onboarding-success">
				<PageShell>
					<LogoSlot>
						<BrandMark>
							<img src={LOGO} alt="ABOUTABL" />
						</BrandMark>
					</LogoSlot>

					<SuccessWrap>
						<PreviewStage>
							<ChangeBeside>
								<GhostBtn type="button" onClick={() => setStep('pick')} disabled={saving}>
									{formatMessage({ id: 'avatar-onboarding-change' })}
								</GhostBtn>
							</ChangeBeside>

							<PreviewCard>
								<PreviewFace
									src={previewUrl}
									alt=""
									decoding="async"
									loading="eager"
								/>
							</PreviewCard>
						</PreviewStage>

						<GreatChoice>
							{formatMessage({ id: 'avatar-onboarding-great-choice' })} 🎉
						</GreatChoice>

						<StartBtn type="button" onClick={() => navigate('/learn', { replace: true })}>
							{formatMessage({ id: 'avatar-onboarding-start' })}
						</StartBtn>
					</SuccessWrap>
				</PageShell>
			</OnboardingRoot>
		);
	}

	return (
		<OnboardingRoot data-testid="avatar-onboarding-pick">
			<PageShell>
				<LogoSlot>
					<BrandMark>
						<img src={LOGO} alt="ABOUTABL" />
					</BrandMark>
				</LogoSlot>

				<HeaderGrid>
					<HeaderLeft>
						{/* spacer matches logo pill height so Home sits under logo */}
						<div aria-hidden style={{ height: 60 }} />
						<HomeBtn type="button" onClick={clearSessionAndGoHome}>
							{formatMessage({ id: 'avatar-onboarding-home' })}
						</HomeBtn>
					</HeaderLeft>
					<HeaderCenter>
						<HeroTitle>
							{formatMessage({ id: 'avatar-onboarding-title-pick' })}{' '}
							<HeroAccent>{formatMessage({ id: 'avatar-onboarding-title-hero' })}</HeroAccent>
						</HeroTitle>
					</HeaderCenter>
					<span aria-hidden />
				</HeaderGrid>

				<Panel>
					<AvatarGrid>
						{STUDENT_AVATAR_PRESETS.map((preset) => (
							<AvatarCard key={preset.id}>
								<AvatarFace src={preset.url} alt="" />
								<SelectBtn
									type="button"
									disabled={saving}
									onClick={() => onSelect(preset.id)}
								>
									{formatMessage({ id: 'navbar-select-avatar' })}
								</SelectBtn>
							</AvatarCard>
						))}
					</AvatarGrid>
					{error ? <ErrorText role="alert">{error}</ErrorText> : null}
				</Panel>
			</PageShell>
		</OnboardingRoot>
	);
}
