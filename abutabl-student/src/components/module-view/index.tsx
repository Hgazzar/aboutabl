import { ModuleViewBodyWrapper, ModuleViewWrapper, ModuleHeaderWrapper } from './styles';
interface IProps {
	header?: JSX.Element;
	children: JSX.Element;
}
export default function ModuleView(props: IProps) {
	const { children, header } = props;
	return (
		<ModuleViewWrapper >
			{header && <ModuleHeaderWrapper>{header}</ModuleHeaderWrapper>}
			<ModuleViewBodyWrapper className={`h-100 ${!header ? 'no_header' : ''}`}>{children}</ModuleViewBodyWrapper>
		</ModuleViewWrapper>
	);
}
