import { Grid, Flex, Avatar } from '@mantine/core';
import Wellcomeimage from 'assets/images/png/hi.png';
import SearchAutoComplete from 'components/searchComponent';
import VectorImage from 'components/vectorImage';
import { HeaderWrapper } from './styles';
import NotificationDropdown from './NotificationDropdown';
function readUserInfo() {
	try {
		const raw = localStorage.getItem('user_info');
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

export default function PageHeader() {
	const user = readUserInfo();
	const displayName = user?.name ?? '';
	const face = user?.avatar_preset || user?.photo;

	return (
		<HeaderWrapper>
			<Grid mr={0} align={'center'} justify={'space-between'}>
				<Grid.Col xs={12} md={6}>
					<Flex direction={'column'} align={'flex-start'} gap={8} className="wellcome_wrapper">
						<Flex gap={16} align={'center'} wrap="wrap">
							{face ? (
								<Avatar src={face} alt="" radius="xl" size={48} />
							) : null}
							<h1 className="text-2xl md:text-3xl font-semibold line-clamp-2 break-words max-w-[min(100%,420px)]">
								Hi, {displayName}
							</h1>
							<img src={Wellcomeimage} alt="" className="hidden sm:block max-h-14 object-contain" />
						</Flex>
						<p>Let’s Learn something new today!</p>
					</Flex>
				</Grid.Col>
				<Grid.Col xs={12} md={6}>
					<Flex gap={32} align={'center'}>
						<SearchAutoComplete className="platinum_shadow" placeholder="search" data={['test']} />
						<NotificationDropdown />
						{/* <Flex align={'center'} justify={'center'} className="notification platinum_shadow">
							<Notification />
						</Flex> */}
					</Flex>
				</Grid.Col>
			</Grid>

			<VectorImage />
		</HeaderWrapper>
	);
}
