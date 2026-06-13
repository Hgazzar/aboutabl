import React, { useState } from 'react';
import { Autocomplete } from '@mantine/core';
import { SearchWrapper } from './styles';
import IconSearch from 'assets/images/svg/search.svg?react';

import { useIntl } from 'react-intl';

interface FilterControlsProps {
	placeholder: string;
	className?: string;
	data: string[]; // Data to be passed to Autocomplete
}

export default function SearchAutoComplete({ placeholder, className, data }: FilterControlsProps) {
	const { formatMessage } = useIntl();
	const [searchValue, setSearchValue] = useState<string>('');

	const handleAutocompleteChange = (value: string) => {
		setSearchValue(value);
	};

	const handleSearchClick = () => {
		// Perform the search action based on the current value in the Autocomplete
		console.log('Search:', searchValue);
	};

	return (
		<SearchWrapper>
			<div className={`search_wrapper ${className ? className : ''}`}>
				<Autocomplete
					data={data} // Use the data prop
					rightSection={<IconSearch onClick={handleSearchClick} className={`${searchValue ? 'active' : ''}`} />}
					// rightSection={searchValue && <IconClose onClick={handleClearSearch} />}
					value={searchValue}
					onChange={handleAutocompleteChange}
					placeholder={formatMessage({
						id: placeholder,
					})}
				/>
			</div>
		</SearchWrapper>
	);
}
