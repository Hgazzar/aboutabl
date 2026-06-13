import React, { useEffect, useState } from "react";
import { HtmlPreview } from "@/utils/htmlPreview";
import { DndContext } from "@dnd-kit/core";
import { Droppable } from "./Droppable";
import { Draggable } from "./Draggable";

function Flow({ answer, corAnswer }: any) {
  const [options, setOptions] = useState<any>({
    q: [],
    a: [],
  });
  const [parent, setParent] = useState<any>([]);

  useEffect(() => {
    const correctAnswer = corAnswer.split(",");

    const questions: any = [];
    const answers: any = [];

    answer?.forEach((item: any) => {
      if (item[0][0] === "q") {
        const id = correctAnswer?.find(
          (i: any) => i.split(":")[0] == item[0][1]
        );
        questions.push({
          id,
          value: (
            <Draggable id={id}>
              {item?.[1]?.includes(".mp3") ? (
                <audio src={item?.[1]} controls />
              ) : item?.[1]?.includes(".png") || item?.[1]?.includes(".jpg") ? (
                <img
                  src={item?.[1]}
                  alt=""
                  style={{ objectFit: "cover", height: "100%" }}
                />
              ) : (
                <HtmlPreview content={item?.[1]} className="[&_p]:m-0" />
              )}
            </Draggable>
          ),
        });
      } else {
        const id = correctAnswer.find(
          (i: any) => i.split(":")[0] == item[0][1]
        );
        answers.push({
          id,
          value: item?.[1]?.includes(".mp3") ? (
            <audio src={item?.[1]} controls />
          ) : item?.[1]?.includes(".png") || item?.[1]?.includes(".jpg") ? (
            <img
              src={item?.[1]}
              alt=""
              style={{ objectFit: "cover", height: "100%" }}
            />
          ) : (
            <HtmlPreview content={item?.[1]} className="[&_p]:m-0" />
          ),
        });
      }
    });

    setOptions({ q: questions, a: answers });
  }, [answer, corAnswer]);

  console.log(options);
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-row gap-44 items-center">
        <div className="flex flex-col gap-10">
          {options?.q?.map((item: any, index: any) => {
            return (
              <div key={index}>
                {!parent?.includes(item?.id) ? (
                  <div className="bg-white border-easyGray border-b-8 border rounded-md my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 rounded-xl w-40 h-40">
                    {item?.value}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-10">
          {options?.a?.map((item: any, index: any) => (
            <div key={index} className="flex flex-row items-center gap-4">
              <Droppable id={item?.id}>
                {parent?.includes(item?.id) ? (
                  <div className="border-green bg-lightGreen rounded-xl bg-white border-easyGray border-b-8 border rounded-md my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 w-40 h-40 ">
                    {options?.q?.find((x: any) => x.id === item.id)?.value}
                  </div>
                ) : (
                  <p className="bg-white text-gray text-xs flex justify-center items-center p-5 m-5 w-40 h-40 rounded-md border border-gray border-dashed">
                    Drag your answer here
                  </p>
                )}
              </Droppable>
              <div className="w-40 h-40 rounded-md my-3 p-4 flex flex-row font-bold justify-center items-center gap-2 rounded-xl border-b-8 border border-easyGray bg-white">
                {item?.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );

  function handleDragEnd(event: any) {
    const { over } = event;
    if (over) {
      setParent((prev: any) => [...prev, over.id]);
    }
  }
}

export default Flow;

// import React, { useEffect, useState } from "react";
// import { DndContext } from "@dnd-kit/core";
// import { Droppable } from "./Droppable";
// import { Draggable } from "./Draggable";

// function Flow({ answer, corAnswer }: any) {
//   const [options, setOptions] = useState<any>({
//     q: [],
//     a: [],
//   });
//   const [parent, setParent] = useState<any>([]);
//   useEffect(() => {
//     const correctAnswer = corAnswer.split(",");

//     const questions: any = [];
//     const answers: any = [];

//     console.log(answer);
//     console.log(corAnswer);
//     answer?.map((item: any, index: any) => {
//       if (item[0][0] === "q") {
//         const id = correctAnswer?.find(
//           (i: any) => i.split(":")[0] == item[0][1]
//         );
//         questions.push({
//           id,
//           value:
//           <Draggable id={id}>
//                       {
//                         item?.[1]?.includes(".mp3") ?
//                           <audio src={item?.value} controls/>
//                           :
//                           item?.[1]?.includes(".png") || item?.[1]?.includes(".jpg") ?
//                           <img src={item?.[1]} alt="" style={{objectFit:"cover",height:"100%"}}/>
//                           :
//                           item?.[1]
//                           }
//             {/* {item?.[1]} */}
//           </Draggable>,
//         });
//       } else {
//         const id = correctAnswer.find(
//           (i: any) => i.split(":")[1] == item[0][1]
//         );
//         answers.push({ id, value:  item?.[1]?.includes(".mp3") ?
//                           <audio src={item?.value} controls/>
//                           :
//                           item?.[1]?.includes(".png") || item?.[1]?.includes(".jpg") ?
//                           <img src={item?.[1]} alt="" style={{objectFit:"cover",height:"100%"}}/>
//                           :
//                           item?.[1] });
//       }
//     });

//     setOptions({ q: questions, a: answers });
//   }, []);
// // console.log(options?.q[5]?.value.props.children.toString());

//   return (
//     <DndContext onDragEnd={handleDragEnd}>
//       <div className="flex flex-row gap-44 items-center">
//         <div className="flex flex-col gap-10">
//           {options?.q?.map((item: any, index: any) => {
//             return (
//               // <div key={index}>{item?.value}</div>
//               <div key={index}>
//                 {!parent?.includes(item?.id) ? (
//                   <div className="bg-white border-easyGray border-b-8 border rounded-md my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 rounded-xl w-40 h-40">
//                     {
//                       //  item?.value?.join("").includes(".mp3") ?
//                       //  <audio src={item?.value.join("")} controls/>
//                       //  :
//                       //  item?.value?.join("").includes(".png") || item?.value?.join("").includes(".jpg") ?
//                       //  <img src={item?.value} alt="" />
//                       //  :
//                       item?.value
//                     }

//                     {/* <img src={item?.value} alt="" /> */}
//                     {/* {item?.value} */}
//                   </div>
//                 ) : null}
//               </div>
//             );
//           })}
//         </div>

//         <div className="flex flex-col gap-10">
//           {options?.a?.map((item: any, index: any) => (
//             <div className="flex flex-row items-center gap-4">
//               <Droppable key={item?.value} id={item?.id}>
//                 {parent?.includes(item?.id) ? (
//                   <div className="border-green bg-lightGreen rounded-xl bg-white border-easyGray border-b-8 border rounded-md my-3 p-4 flex flex-row font-bold justify-stretch items-center gap-2 w-40 h-40 ">
//                     {
//                       options?.q?.find((x: any) => {
//                         return x.id === item.id;
//                       })?.value
//                     }
//                   </div>
//                 ) : (
//                   <p className="bg-white text-gray text-xs flex justify-center items-center p-5 m-5 w-40 h-40 rounded-md border border-gray border-dashed">
//                     Drag your answer here
//                   </p>
//                 )}
//               </Droppable>
//               <div className="w-40 h-40 rounded-md my-3 p-4 flex flex-row font-bold justify-center items-center gap-2 rounded-xl border-b-8 border border-easyGray bg-white">
//                 {item?.value}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </DndContext>
//   );

//   function handleDragEnd(event: any) {
//     const { over } = event;
//     // console.log(over);
//     setParent((prev: any) => {
//       return [...prev, over?.id];
//     });
//   }
// }

// export default Flow;
