export const FORM_REGEX_VALIDATORS = {
	textOnly: /^[A-Za-z\u0600-\u065F\u066A-\u06EF\u06FA-\u06FF\u0600-\u065F\u066A-\u06EF\u06FA-\u06FF\s]+$/g,
	textEnglishOnly: /^[A-Za-z\s]+$/g,
	textArabicOnly: /^[\u0621-\u064A\u0660-\u0669 ]+$/g,
	numbersOnly: /^[0-9]*$/g,
	phone: /^(05)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/i,
	password: /^.{4,12}$/g,
	nationalID: /^[0-9]{10}$/g,
	otpNumber: /^[0-9]{4}$/,
	email: /^([\w-.]+@([\w-]+\.)+[\w-]{2,4})$/g,
	url: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/g,
};
