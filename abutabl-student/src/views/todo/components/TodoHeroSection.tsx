import { useLayoutEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { figmaDashboardAssetUrl } from 'config/figmaAssets';
import { theme } from 'global-styles';
import TodoSparkSunburst from './TodoSparkSunburst';

/** Figma `birdMainPic` (`778:493`). */
const BIRD = figmaDashboardAssetUrl('todo-bird-reading.svg');

const Hero = styled.section`
	position: relative;
	min-height: 308px;
	padding: 0 25px;
	overflow: visible;
	box-sizing: border-box;
`;

const IllustrationColumn = styled.div`
	position: relative;
	justify-self: end;
	width: min(433px, 100%);
	min-height: 343px;
	overflow: visible;
	pointer-events: none;

	@media (max-width: 720px) {
		justify-self: center;
	}
`;

const IllustrationCluster = styled.div`
	position: relative;
	z-index: 1;
	width: 100%;
	aspect-ratio: 433 / 343;
	margin-top: 8px;
	margin-bottom: -44px;
	overflow: visible;

	@media (max-width: 720px) {
		margin-bottom: -28px;
	}
`;

/** Bird sits above the shared `/progress` sunburst. */
const Bird = styled.img`
	position: relative;
	z-index: 1;
	width: 100%;
	height: 100%;
	display: block;
	object-fit: contain;
	object-position: center bottom;
`;

const HeroGrid = styled.div`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(260px, 48%);
	align-items: start;
	gap: 8px;
	min-height: 308px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

const Copy = styled.div`
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	padding-top: 4px;
	max-width: 100%;
	text-align: start;
`;

const TextMeasureWrap = styled.div`
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	width: fit-content;
	max-width: 100%;
`;

/** Figma `you got this!` (`778:512`) — Fredoka, two lines, 1px #492613 stroke. */
const GotThis = styled.h1`
	margin: 0;
	padding: 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 500;
	font-size: 64px;
	line-height: 0.92;
	letter-spacing: -0.02em;
	color: ${theme.colours.white};
	-webkit-text-stroke: 1px #492613;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #492613,
		-1px 0 0 #492613,
		0 1px 0 #492613,
		0 -1px 0 #492613,
		1px 1px 0 #492613,
		-1px 1px 0 #492613,
		1px -1px 0 #492613,
		-1px -1px 0 #492613;
`;

const GotThisLine = styled.span`
	display: block;
`;

const Tagline = styled.p`
	margin: 0;
	width: fit-content;
	max-width: 100%;
	font-family: ${theme.fonts.Nunito};
	font-weight: 600;
	font-size: 18px;
	line-height: 1.3;
	color: rgba(255, 255, 255, 0.92);
`;

/** Figma `My assignments` — Fredoka yellow title with black outline (same as Leaderboard). */
const AssignmentsTitle = styled.h2`
	margin: 8px 0 0;
	font-family: ${theme.fonts.Fredoka};
	font-weight: 600;
	font-size: clamp(28px, 3.6vw, 40px);
	line-height: 1.15;
	color: #ffb300;
	-webkit-text-stroke: 1px #000000;
	paint-order: stroke fill;
	text-shadow:
		1px 0 0 #000000,
		-1px 0 0 #000000,
		0 1px 0 #000000,
		0 -1px 0 #000000;
`;

export default function TodoHeroSection() {
	const { formatMessage, locale } = useIntl();
	const taglineRef = useRef<HTMLParagraphElement>(null);
	const gotThisRef = useRef<HTMLHeadingElement>(null);
	const line2Ref = useRef<HTMLSpanElement>(null);
	const line1 = formatMessage({ id: 'todo-got-this-line-1' });
	const line2 = formatMessage({ id: 'todo-got-this-line-2' });
	const subtitle = formatMessage({ id: 'todo-got-this-subtitle' });

	useLayoutEffect(() => {
		const tagline = taglineRef.current;
		const gotThis = gotThisRef.current;
		if (!tagline || !gotThis) return;

		const fitHeadlineWidth = () => {
			const taglineEl = taglineRef.current;
			const gotThisEl = gotThisRef.current;
			const line2El = line2Ref.current;
			if (!taglineEl || !gotThisEl || !line2El) return;

			const targetWidth = taglineEl.getBoundingClientRect().width;
			if (targetWidth <= 0) return;

			let min = 48;
			let max = 180;
			let best = min;

			while (min <= max) {
				const mid = Math.floor((min + max) / 2);
				gotThisEl.style.fontSize = `${mid}px`;
				const line2Width = line2El.getBoundingClientRect().width;
				if (line2Width <= targetWidth) {
					best = mid;
					min = mid + 1;
				} else {
					max = mid - 1;
				}
			}

			gotThisEl.style.fontSize = `${best}px`;
		};

		fitHeadlineWidth();

		const observer = new ResizeObserver(fitHeadlineWidth);
		observer.observe(tagline);

		return () => observer.disconnect();
	}, [locale, line1, line2, subtitle]);

	return (
		<Hero aria-label={formatMessage({ id: 'todo-got-this-title' })}>
			<HeroGrid>
				<Copy>
					<TextMeasureWrap>
						<GotThis ref={gotThisRef}>
							<GotThisLine>{line1}</GotThisLine>
							<GotThisLine ref={line2Ref}>{line2}</GotThisLine>
						</GotThis>
						<Tagline ref={taglineRef}>{subtitle}</Tagline>
					</TextMeasureWrap>
					<AssignmentsTitle>{formatMessage({ id: 'todo-my-assignments' })}</AssignmentsTitle>
				</Copy>

				<IllustrationColumn aria-hidden>
					<IllustrationCluster>
						<TodoSparkSunburst />
						<Bird src={BIRD} alt="" decoding="async" />
					</IllustrationCluster>
				</IllustrationColumn>
			</HeroGrid>
		</Hero>
	);
}
