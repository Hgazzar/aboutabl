import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRecoilValue } from 'recoil';
import { langState } from 'store';

import { IDataList, IReply } from '../..';
import { AxiosResponse } from 'axios';
import instance from 'axios-instance';

export const whoAmi = localStorage.getItem('whoami');

const toolbarOptions = [
	['bold', 'italic', 'underline', 'align'],
	['link', 'image', 'video'],
];

const modules = {
	toolbar: toolbarOptions,
	keyboard: {
		bindings: {
			handleEnter: {
				key: 13, // Enter key
				handler: function () {
					// Handle Enter key press
					return false; // Prevent default behavior (adding a line break)
				},
			},
		},
	},
};
function Footer({
	showData,
	setReplies,
	replies,
}: {
	showData: IDataList | null;
	replies: IReply[] | [];
	setReplies: Function;
}) {
	const langType = useRecoilValue(langState);
	const [value, setValue] = useState('');
	async function sendMessageToServer(value: any, id: number | null) {
		const data = {
			meta: {
				...showData?.meta,
				replies: [...replies, value],
			},
		};
		if (id) {
			try {
				const res: AxiosResponse<IDataList> = await instance.patch<IDataList>(`/tickets/${id}`, data);
				setReplies(res.data.meta.replies);
			} catch (error) {
				console.error('Error fetching list:', error);
			}
		}
	}
	const sendMessage = (e: any) => {
		if (!(value === '<p><br></p>' || value === '')) {
			if ((e && e.keyCode === 13 && e.shiftKey === false && e.ctrlKey === false) || (e && e.sendByMouse)) {
				const replay: IReply = {
					id: Math.random(),
					message: value,
					messageStatus: 'client',
					sender: whoAmi,
					reciever: 'admin',
				};

				showData && sendMessageToServer({ ...replay, messageStatus: 'sent' }, showData.id);

				setReplies([...replies, replay]);
				setValue('');
			}
		}
	};

	return (
		showData && (
			<>
				{showData.status === 'Open' ? (
					<div className="p-6">
						<div className="message-sender relative ">
							<div
								style={{
									[langType === 'en' ? 'right' : 'left']: '0px',
								}}
								className="sender-wraper w-[150px] absolute top-[40px] flex items-center justify-center h-[calc(100%-46px)]"
							>
								<button
									onClick={() => sendMessage({ sendByMouse: true })}
									className="focus-visible:outline-none py-4 px-8 rounded-2xl bg-[#1EBBA3] shadow-[0px_4px_0px_0px_#1B9582] text-[#fff] cursor-pointer z-10"
								>
									Send
								</button>
							</div>
							<style>
								{`
						.ql-container.ql-snow {
    border: none;
}

.ql-editor {
  height: 90px;
  width:calc(100% - 150px);
  overflow-y: auto;
}
.quill{
	    {/* height: -webkit-fill-available; */}
}
.ql-toolbar.ql-snow {
    border: 1px solid ;
	border-color: transparent transparent #E7E7E7 transparent;

}
						`}
							</style>
							<ReactQuill
								modules={modules}
								onKeyDown={sendMessage}
								className=" rounded-lg border border-[#E7E7E7] shadow-[0px_6px_0px_0px_#E5E5E5]"
								theme="snow"
								value={value}
								onChange={setValue}
							/>
						</div>
					</div>
				) : (
					<div className="p-6">
						<div className="w-fit mx-auto bg-[#f3fffa] p-2 rounded shadow">
							<span className="text-sm text-[cadetblue]">Conversation ended. You cannot reply!</span>
						</div>
					</div>
				)}
			</>
		)
	);
}

export default Footer;
