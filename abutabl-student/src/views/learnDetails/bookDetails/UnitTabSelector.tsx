import { useIntl } from 'react-intl';
import { splitVisibleUnits } from './bookDetailsModel';
import type { ViewSubjectUnit } from './bookDetailsTypes';
import { UnitOverflowBtn, UnitTab, UnitTabsBar } from './bookDetailsStyles';

type Props = {
	units: ViewSubjectUnit[];
	activeUnitId: number | null;
	onSelect: (unitId: number) => void;
	expanded: boolean;
	onExpandOverflow: () => void;
};

export default function UnitTabSelector({
	units,
	activeUnitId,
	onSelect,
	expanded,
	onExpandOverflow,
}: Props) {
	const { formatMessage } = useIntl();
	const { visible, overflowCount } = splitVisibleUnits(units);
	const shown = expanded ? units : visible;

	return (
		<UnitTabsBar role="tablist" aria-label={formatMessage({ id: 'book-details-units' })}>
			{shown.map((unit, index) => {
				const active = unit.id === activeUnitId;
				return (
					<UnitTab
						key={unit.id}
						type="button"
						role="tab"
						aria-selected={active}
						$active={active}
						onClick={() => onSelect(unit.id)}
					>
						{formatMessage({ id: 'book-details-unit-tab' }, { n: index + 1, name: unit.name })}
					</UnitTab>
				);
			})}
			{!expanded && overflowCount > 0 ? (
				<UnitOverflowBtn type="button" onClick={onExpandOverflow} $active={false}>
					{formatMessage({ id: 'book-details-more-units' }, { count: overflowCount })}
				</UnitOverflowBtn>
			) : null}
		</UnitTabsBar>
	);
}
