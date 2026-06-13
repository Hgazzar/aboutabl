import { ErrorMessage } from '@hookform/error-message';
import { DateInput, DatePickerProps } from '@mantine/dates';
import { RegisterOptions, useFormContext, Controller } from 'react-hook-form';
import { DatePickerInputWrapper } from './styles';

interface IProps extends Omit<DatePickerProps, 'value'> {
	name: string;
	rules?: RegisterOptions;
	label?: string;
	inputFormat?: string;
	icon?: any;
	placeholder?: string
}

function DatePickerInput({ name, rules, placeholder, label, inputFormat, icon }: IProps) {
	/* ---------------------------------- Hooks --------------------------------- */
	const { control, formState } = useFormContext();
	const { errors } = formState;

	/* -------------------------------- Functions ------------------------------- */
	function handleDatePicker(value: Date | null, onChangeCallback: (...event: any[]) => void) {
		onChangeCallback(value);
	}
	return (
		<DatePickerInputWrapper>
			<label>
				{label && <p>{label}</p>}
				<Controller
					name={name}
					control={control}
					rules={rules}
					render={({ field: { onChange, value } }) => (
						<div>
							<DateInput
								allowDeselect
								onChange={(value) => handleDatePicker(value, onChange)}
								value={value}
								placeholder={placeholder}
								valueFormat={inputFormat}
								icon={icon}
							/>
						</div>
					)}
				/>
			</label>
			{!!errors && !!errors[name] && (
				<div className="ErrorMessageStyle">
					<ErrorMessage errors={errors} name={name} render={({ message }) => <p>{message}</p>} />
				</div>
			)}
		</DatePickerInputWrapper>
	);
}

export default DatePickerInput;
