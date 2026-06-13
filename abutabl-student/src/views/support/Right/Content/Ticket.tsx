import { IDataList, } from '../..';
import DocumentIcon from '../../svgs/DocumentIcon';
import DownloadIcon from '../../svgs/DownloadIcon';
function Ticket({ showData }: { showData: IDataList | null }) {
	return (
		<article className="meta">
			<h1 className="title text-base font-medium text-[#1F1E1E]">{showData?.meta.title}</h1>
			<p className="my-4 body text-sm font-normal text-[#9C9B9B]">{showData?.meta.body}</p>
			{showData && showData.meta.file && (
				<div className="my-4 p-6 flex w-fit gap-2 donwload items-center rounded-lg border border-[#E7E7E7] shadow-[0px_6px_0px_0px_#E5E5E5]">
					<div className="meta flex gap-2">
						<div className="icon">
							<DocumentIcon />
						</div>
						<div className="file-info">
							<h1 className="title text-sm font-medium text-[#1F1E1E]">{'Document'}</h1>
							<p className="body text-xs font-normal text-[#9C9B9B]">{'11.5 Mb'}</p>
						</div>
					</div>
					<button className="download-icon w-6 h-5 flex justify-center items-center">
						<DownloadIcon />
					</button>
				</div>
			)}
		</article>
	);
}

export default Ticket