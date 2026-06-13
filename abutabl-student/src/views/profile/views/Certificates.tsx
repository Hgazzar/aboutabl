import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@mantine/core';
import PreviewHeader from '../components/PreviewHeader';
import { getRequest } from 'lib/requests';
import { toast } from 'react-toastify';
import coursePlaceholder from 'assets/images/svg/course-placeholder.svg';
import LoadingPartially from 'components/loading-partially';

export type CertificateRow = {
	id: number;
	name: string;
	photo: string | null;
	progress: number;
	earned_at: string | null;
};

function Certificates() {
	const { formatMessage, locale } = useIntl();
	const navigate = useNavigate();
	const [items, setItems] = useState<CertificateRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getRequest('certificates')
			.then((res: { certificates?: CertificateRow[] }) => {
				const list = res?.certificates ?? [];
				setItems(Array.isArray(list) ? list : []);
			})
			.catch(() => {
				setItems([]);
				toast.error(formatMessage({ id: 'Certificates-load-error' }));
			})
			.finally(() => setLoading(false));
	}, [formatMessage]);

	const formatEarned = (iso: string | null) => {
		if (!iso) return null;
		try {
			return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso;
		}
	};

	const onCertificateInfo = async (subjectId: number) => {
		try {
			const res = await getRequest(`subjects/${subjectId}/certificate`);
			toast.info((res as { message?: string })?.message ?? formatMessage({ id: 'Certificate-info' }));
		} catch {
			toast.error(formatMessage({ id: 'Certificates-load-error' }));
		}
	};

	return (
		<div>
			<PreviewHeader title={formatMessage({ id: 'My-certificates' })} />
			<div className="p-8 flex flex-col gap-6">
				{loading ? (
					<LoadingPartially />
				) : items.length === 0 ? (
					<Text c="dimmed">{formatMessage({ id: 'Certificates-empty' })}</Text>
				) : (
					items.map((row) => (
						<div
							key={row.id}
							className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-[#eee] rounded-lg bg-white"
						>
							<img
								src={row.photo || coursePlaceholder}
								alt=""
								className="w-20 h-20 object-contain rounded-md border border-stone-100 shrink-0"
							/>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-lg line-clamp-2">{row.name}</p>
								{row.earned_at ? (
									<p className="text-sm text-[#9C9B9B] mt-1">
										{formatMessage({ id: 'Certificates-earned-date' })}: {formatEarned(row.earned_at)}
									</p>
								) : null}
							</div>
							<div className="flex flex-wrap gap-2 shrink-0">
								<Button size="sm" variant="light" onClick={() => onCertificateInfo(row.id)}>
									{formatMessage({ id: 'Certificate-info' })}
								</Button>
								<Button size="sm" onClick={() => navigate(`/learn/${row.id}`)}>
									{formatMessage({ id: 'Open-subject' })}
								</Button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export default Certificates;
