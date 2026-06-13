import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Select as MantineSelect, SelectProps } from '@mantine/core';
import { SelectWrapper } from './styles';
import { RegisterOptions, useFormContext } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';

interface IProps extends SelectProps {
	name: string;
	label?: string;
	isLoading?: boolean;
	registerOptions?: RegisterOptions;
	isrequired?: boolean;
}

function Select({
	name,
	disabled,
	label,
	icon,
	nothingFound,
	data,
	onSearchChange,
	isLoading,
	searchable = true,
	isrequired,
	...rest
}: IProps) {
	const { register, formState } = useFormContext();
	const { errors } = formState;
	/* ------------------------------- Local State ------------------------------ */
	const [isSearched, setIsSearched] = useState(false);
	/* ---------------------------------- Hooks --------------------------------- */
	const { formatMessage } = useIntl();

	/* ------------------------------ Derived State ----------------------------- */
	const notFoundContent = useMemo(() => {
		if (data === undefined || !isSearched || isLoading) return;
		if (nothingFound) return nothingFound;
		return <p>{formatMessage({ id: 'NoContentFound' })}</p>;
	}, [data, nothingFound, isLoading, isSearched, formatMessage]);

	function handleOnSearch(value: string) {
		setIsSearched(value !== '');
		onSearchChange && onSearchChange(value);
	}

	return (
		<SelectWrapper>
			<label className={`${disabled ? 'disabled' : ''}`}>
				{label && (
					<p>
						{label} {isrequired && <span>*</span>}
					</p>
				)}
				<MantineSelect
					{...rest}
					data={data}
					icon={icon}
					nothingFound={notFoundContent}
					onSearchChange={handleOnSearch}
					searchable={searchable}
					disabled={disabled}
				/>
			</label>
			{!!errors && !!errors[name] && (
				<div className="ErrorMessageStyle">
					<ErrorMessage errors={errors} name={name} render={({ message }) => <p>{message}</p>} />
				</div>
			)}
		</SelectWrapper>
	);
}

export default Select;
