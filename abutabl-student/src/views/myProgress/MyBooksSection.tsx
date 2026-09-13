import { useIntl } from 'react-intl';
import type { MyProgressBook } from 'lib/myProgressApi';
import MyBookCard from './MyBookCard';
import { BooksList, EmptyHint, Section, SectionTitle } from './styles';

type Props = {
	books: MyProgressBook[];
};

export default function MyBooksSection({ books }: Props) {
	const { formatMessage } = useIntl();

	return (
		<Section>
			<SectionTitle>{formatMessage({ id: 'my-progress-my-books' })}</SectionTitle>
			{books.length === 0 ? (
				<EmptyHint>{formatMessage({ id: 'my-progress-books-empty' })}</EmptyHint>
			) : (
				<BooksList>
					{books.map((book, index) => (
						<MyBookCard key={book.subject_id} book={book} index={index} />
					))}
				</BooksList>
			)}
		</Section>
	);
}
