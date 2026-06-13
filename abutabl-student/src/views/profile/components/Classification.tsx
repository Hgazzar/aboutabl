import badge from 'assets/images/png/Bitmap.png';
import { Progress } from '@mantine/core';
import { theme } from 'global-styles';
import { useRecoilValue } from 'recoil';
import { langState } from 'store';
import { useIntl } from 'react-intl';
import type { ProgressClassification } from '../views/PreviewStudy';

type ClassificationProps = {
	data?: ProgressClassification | null;
	loading?: boolean;
};

function Classification({ data, loading }: ClassificationProps) {
	const langType = useRecoilValue(langState);
	const { formatMessage } = useIntl();
	const isRtl = langType === 'ar';
	const progressStyle = isRtl ? 'rotate-180' : '';

	const tier = data?.tier ?? 'Silver';
	const tierKey = data?.tier_key ?? 'Silver-Tire';
	const description = data?.description ?? formatMessage({ id: 'Submit-on-time' });
	const progressPercent = data?.progress_percent ?? 55;
	const nextTierMessage = data?.next_tier ? (data?.next_tier_message ?? formatMessage({ id: 'Next-tire-Golden' })) : '';
	const badgeSrc = data?.badge_image || badge;

	return (
		<div className="p-8 flex flex-col md:flex-row items-center gap-8 bg-[#FAF9F9] rounded-3xl w-full">
			<img src={badgeSrc} alt="badge" className="w-[120px]" />
			<div className="flex-1">
				<h4 className="font-medium">
					{loading ? '...' : (tierKey ? formatMessage({ id: tierKey }).toString() : tier)}
				</h4>
				<p className="text-sm text-[#9C9B9B] leading-8">{description}</p>
				<Progress value={progressPercent} color={theme.colours.Warning} h={16} className={`rounded-[50px] ${progressStyle}`} />
				{nextTierMessage && (
					<p className="text-[#C1921D] text-xs leading-8">{nextTierMessage}</p>
				)}
			</div>
		</div>
	);
}

export default Classification;
