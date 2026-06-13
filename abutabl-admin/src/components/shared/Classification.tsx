export {};
// import badge from "assets/images/png/Bitmap.png";
// import { Progress } from "@mantine/core";
// import { theme } from "global-styles";
// import { useRecoilValue } from "recoil";
// import { langState } from "store";
// import { useIntl } from "react-intl";

// function Classification() {
//   const langType = useRecoilValue(langState);
//   const { formatMessage } = useIntl();
//   const isRtl = langType === "ar";
//   const progressStyle = isRtl ? "rotate-180" : "";

//   return (
//     <div className="p-8 flex flex-col md:flex-row items-center gap-8 bg-[#FAF9F9] rounded-3xl w-full">
//       <img src={badge} alt="badge" className="w-[120px]" />
//       <div className="flex-1">
//         <h4 className="font-medium">{formatMessage({ id: "Silver-Tire" })}</h4>
//         <p className="text-sm text-[#9C9B9B] leading-8">
//           {formatMessage({ id: "Submit-on-time" })}
//         </p>
//         <Progress
//           value={55}
//           color={theme.colours.Warning}
//           h={16}
//           className={`rounded-[50px] ${progressStyle}`}
//         />
//         <p className="text-[#C1921D] text-xs leading-8">
//           {formatMessage({ id: "Next-tire-Golden" })}
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Classification;
