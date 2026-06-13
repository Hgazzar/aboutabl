import { Modal as MantineModal, ModalProps } from '@mantine/core';
import { createStyles } from '@mantine/core';

const useStyles = createStyles(() => ({
	modalContainer: {
		'z-index': 9999,
	},
}));

export default function Modal(props: ModalProps) {
	const { children, centered = true, size = 'auto', ...rest } = props;
	const { classes } = useStyles();

	return (
		<MantineModal className={` ${classes.modalContainer}`} size={size} centered={centered} {...rest}>
			{children}
		</MantineModal>
	);
}
