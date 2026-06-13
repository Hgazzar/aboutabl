import { useEffect, useRef } from 'react';
import { LoaderWrapper } from './styles';
import LoaderIcon from './LoadingPartially.json';
import lottie from 'lottie-web';
export default function LoadingPartially() {
	const container = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (lottie && container.current) {
			const animation = lottie.loadAnimation({
				container: container.current,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				animationData: LoaderIcon,

			});
			return () => animation.destroy();
		}
	}, []);

	return <LoaderWrapper ref={container} />;
}
