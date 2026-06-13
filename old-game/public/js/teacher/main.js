// script.js

let game_id = document.getElementById('game_id').value
document.addEventListener("DOMContentLoaded", function () {
    const boxGame = document.querySelector(".boxGame");


    if (boxGame) {
        boxGame.addEventListener("click", function (event) {
            event.preventDefault(); // منع الرابط من التحميل الفوري
            boxGame.classList.add("bounce-animation");

            // الانتظار حتى انتهاء الأنيميشن ثم الانتقال إلى الرابط
            boxGame.addEventListener("animationend", function () {
                window.location.href = '/'+game_id+'/waiting';
            });
        });
    }
});


// script.js

document.addEventListener("DOMContentLoaded", function () {
    const musicBtn = document.querySelector(".musicBtn");
    const audio = new Audio('/assets/112.mp3'); // استبدل بالمسار الصحيح لملف الموسيقى
    let isMuted = true;

    console.log(audio)
    // تشغيل الموسيقى عند تحميل الصفحة
    audio.loop = true; // لتكرار الموسيقى
    audio.play();

    // تغيير الأيقونة عند النقر
    musicBtn.addEventListener("click", function () {
        if (isMuted) {
            audio.play();
            musicBtn.innerHTML =
                '<svg fill="#fff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 48.824 48.824" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <path d="M28.043,32.874c-0.238,0-0.475-0.085-0.66-0.249l-4.623-4.07h-5.051c-0.552,0-1-0.449-1-1v-7.2c0-0.552,0.448-1,1-1 h4.688l5.078-3.508c0.305-0.211,0.702-0.234,1.032-0.062c0.329,0.173,0.535,0.514,0.535,0.886v15.203 c0,0.394-0.229,0.749-0.588,0.911C28.322,32.846,28.182,32.874,28.043,32.874z M18.709,26.553h4.428 c0.243,0,0.479,0.09,0.66,0.25l3.246,2.857V18.577l-3.766,2.602c-0.166,0.115-0.365,0.177-0.568,0.177h-4V26.553z"></path> </g> <g> <path d="M24.412,48.824C10.951,48.824,0,37.873,0,24.412S10.951,0,24.412,0s24.412,10.951,24.412,24.412 S37.873,48.824,24.412,48.824z M24.412,2C12.055,2,2,12.055,2,24.412C2,36.77,12.055,46.824,24.412,46.824 c12.357,0,22.412-10.055,22.412-22.412C46.824,12.054,36.77,2,24.412,2z"></path> </g> </g> </g> </g></svg>'; // أيقونة الصوت
        } else {
            audio.pause();
            musicBtn.innerHTML =
                '<svg fill="#fff" height="24px" width="24px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 59.986 59.986" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M51.213,8.78C39.517-2.917,20.484-2.916,8.787,8.78C3.121,14.446,0,21.98,0,29.993S3.121,45.54,8.787,51.206 c5.848,5.849,13.531,8.772,21.213,8.772s15.365-2.924,21.213-8.772C62.91,39.509,62.91,20.477,51.213,8.78z M10.201,10.194 C15.66,4.736,22.83,2.007,30,2.007c6.858,0,13.713,2.504,19.074,7.498L42,16.579v-6.479c0-1.127-0.584-2.134-1.563-2.693 c-0.978-0.561-2.143-0.553-3.115,0.019c-0.063,0.037-0.121,0.081-0.174,0.131L23.906,19.884c-0.149,0.072-0.313,0.109-0.479,0.109 h-8.324c-1.711,0-3.104,1.393-3.104,3.104v12.793c0,1.711,1.392,3.104,3.104,3.104h4.482L9.511,49.068 C4.664,43.869,2,37.137,2,29.993C2,22.514,4.913,15.483,10.201,10.194z M21.586,36.993h-6.482c-0.608,0-1.104-0.495-1.104-1.104 V23.096c0-0.608,0.495-1.104,1.104-1.104h8.324c0.551,0,1.095-0.147,1.572-0.428c0.063-0.036,0.122-0.08,0.176-0.131l13.244-12.33 c0.465-0.226,0.868-0.053,1.025,0.037C39.611,9.237,40,9.522,40,10.099v8.479L21.586,36.993z M40,21.407v27.479 c0,0.577-0.389,0.862-0.556,0.958c-0.158,0.09-0.562,0.262-1.025,0.037l-13.244-12.33c-0.054-0.051-0.113-0.095-0.176-0.131 c-0.224-0.132-0.466-0.229-0.713-0.3L40,21.407z M49.799,49.792c-10.68,10.679-27.908,10.904-38.873,0.689l11.488-11.488h1.013 c0.166,0,0.329,0.037,0.479,0.109L37.148,51.43c0.053,0.05,0.112,0.094,0.174,0.131c0.492,0.289,1.033,0.434,1.574,0.434 c0.529,0,1.058-0.138,1.541-0.415C41.416,51.02,42,50.013,42,48.887V19.407l8.488-8.488C60.704,21.884,60.479,39.112,49.799,49.792z "></path> </g></svg>'; // أيقونة كتم الصوت
        }
        isMuted = !isMuted;
    });
});


// script.js

document.addEventListener("DOMContentLoaded", function () {
    const minutesElement = document.querySelector(".minutes");
    const secondsElement = document.querySelector(".seconds");

    let minutes = minutesElement.textContent;
    let seconds = 59;

    // const updateTimer = () => {
    //     if (seconds === 0) {
    //         if (minutes === 0) {
    //             clearInterval(timerInterval);
    //             if (window.location.href.includes('/statistics-list')) {
    //                 window.location.href = '/teacher/facts/'+game_id;
    //             }
    //         } else {
    //             minutes--;
    //             seconds = 59;
    //         }
    //     } else {
    //         seconds--;
    //     }
    //
    //     if (minutesElement) {
    //         minutesElement.textContent = String(minutes).padStart(2, '0');
    //     }
    //     if (secondsElement) {
    //         secondsElement.textContent = String(seconds).padStart(2, '0');
    //     }
    // };
    const countdownDuration = parseInt(minutesElement.textContent) * 60 * 1000; // دقيقتين بالمللي ثانية
    const now = Date.now();
    let endTime = localStorage.getItem("countdownEndTime");
    if (!endTime) {
        console.log(countdownDuration)
        endTime = now + countdownDuration;
        localStorage.setItem("countdownEndTime", endTime);
    } else {
        endTime = parseInt(endTime, 10);
    }

    const updateTimer = () => {
        const remainingTime = endTime - Date.now();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            localStorage.removeItem("countdownEndTime");
            minutesElement.textContent = "00";
            secondsElement.textContent = "00";
            if (window.location.href.includes('/statistics-list')) {
                window.location.href = '/teacher/facts/'+game_id;
            }
            return;
        }

        const minutes = Math.floor(remainingTime / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        minutesElement.textContent = String(minutes).padStart(2, "0");
        secondsElement.textContent = String(seconds).padStart(2, "0");
    };

    const timerInterval = setInterval(updateTimer, 1000);
});

