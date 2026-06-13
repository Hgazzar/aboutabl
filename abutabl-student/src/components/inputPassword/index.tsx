import { HTMLInputTypeAttribute, InputHTMLAttributes } from 'react';
import { PasswordInput as MantineInput, InputProps } from '@mantine/core';
import { useFormContext, RegisterOptions } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { InputWrapper } from './styles';

interface IProps
	extends Pick<InputHTMLAttributes<HTMLInputElement>, 'maxLength' | 'disabled' | 'min' | 'max'>,
		InputProps {
	name: string;
	registerOptions?: RegisterOptions;
	type?: Exclude<HTMLInputTypeAttribute, 'range' | 'reset' | 'submit' | 'search'>;
	placeholder?: string;
	iconPlaceholder?: string;
	label?: string;
	readonly?: boolean;
	labelVisibility?: boolean;
	className?: string;
	value?: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
}

function InputPassword({
	icon,
	name,
	registerOptions,
	placeholder,
	label,
	labelVisibility = true,
	className,
	disabled,
	defaultValue,
	value,
	onChange,
}: IProps) {
	const { register, formState } = useFormContext();
	const { errors } = formState;

	// onChange Handler
	const onChangeHandler = (Event: any) => {
		const element = { ...(register && { ...register(`${name}`, registerOptions) }) };
		if (Object.keys(element).length !== 0) element.onChange(Event);
		if (onChange) onChange(Event);
	};
	return (
		<InputWrapper islabelVisible={labelVisibility} className={className}>
			<label className={`${disabled ? 'disabled' : ''}`}>
				{label && (
					<p>
						{label}
						{typeof registerOptions?.required === 'object' && registerOptions?.required.value}
					</p>
				)}
				<MantineInput
					icon={icon}
					placeholder={placeholder}
					{...register(name, registerOptions)}
					value={value}
					onChange={onChangeHandler}
					defaultValue={defaultValue}
				/>
			</label>

			{!!errors && !!errors[name] && (
				<div className="ErrorMessageStyle">
					<ErrorMessage errors={errors} name={name} render={({ message }) => <p>{message}</p>} />
				</div>
			)}
		</InputWrapper>
	);
}

export default InputPassword;
