const terminal = document.getElementById("terminal");
const buttons = document.getElementById("buttons");
const messages = [
  "> new user connected...",
  "> welcome to hacking game...",
  "> please choose password...",
  "> Hack complete!",
];
let index = 0;
function typeMessage() {
  if (index < messages.length) {
    let line = messages[index] + "\n";
    let i = 0;
    let interval = setInterval(() => {
      if (i < line.length) {
          if (terminal) {
              terminal.innerHTML += line[i];
          }
        i++;
      } else {
        clearInterval(interval);
        index++;
        setTimeout(typeMessage, 1000);
      }
    }, 50);
  } else {
      if (terminal) {
          terminal.innerHTML += "\nAccess Granted!\n";
      }
    setTimeout(() => {
        if (buttons) {
            buttons.style.display = "block";
        }
    }, 1000);
  }
}
typeMessage();

let hasClicked = false;
const images = [
  "/assets/images/hacked.png",
  "/assets/images/luck.png",
  "/assets/images/gold.png",
];

const answerImages = document.querySelectorAll(".answerImage");

answerImages.forEach((img) => {
  img.addEventListener("click", () => {
    // Get a random image from the array
    const randomImage = images[Math.floor(Math.random() * images.length)];

    console.log(randomImage)
    if (randomImage.includes('hacked')) {
        window.location.href = '/student/password_hacking/show/' + game_id;
    } else if (randomImage.includes('gold')) {
        $.ajax({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            url: "/student/gift/save",
            data: {},
            type: 'POST',
            dataType: 'json',
            success: function (result) {
                setTimeout(function() {
                    window.location.href = '/student/question/' + game_id;
                }, 2500)
            }
        })
    } else if (randomImage.includes('luck')) {
        setTimeout(function() {
            window.history.back();
        }, 2500)
    }
    // Display the random image in the clicked image
    img.src = randomImage;
    hasClicked = true;
    answerImages.forEach((otherImg) => {
      otherImg.style.pointerEvents = "none"; // Disable further clicks
    });
  });
});

function answer_hacking_question(answer, index) {
    let correct_answer = document.getElementById('correct_answer').value
    let question_id = document.getElementById('question_id').value
    let question_index = document.getElementById('question_index').value
    let question_num = document.getElementById('question_num')

    if (answer === correct_answer) {

        // إضافة فئة successAnswer
        document.getElementById('answerCard'+index).classList.add("successAnswer");

        let student_coins = document.getElementById('student_coins')
        // if (student_coins) {
        //     student_coins.innerText = parseInt(student_coins.innerText) + 1
        // }
        if (questions[parseInt(question_num.innerText)-1].explanation) {
            $('#show_correct_answer').empty()
            $('#show_correct_answer').append(`
                <div class="question" style="height: auto;display: grid;padding-bottom: 10px;padding-top: 10px;max-width: 100% !important;align-items: center;margin-right: 40px;margin-left: 40px;">
                    <h1>Answer Explanation: <span style="text-transform: capitalize;">${questions[parseInt(question_num.innerText)-1].explanation}</span></h1>
                </div>
            `)
            // setTimeout(function() {
            //     //your code to be executed after 1 second
            // },  7000);
        }
        // student_answer_correct.innerText =  parseInt(student_answer_correct.innerText) +1

    } else {
        // إضافة wrongAnswer
        document.getElementById('answerCard'+index).classList.add("wrongAnswer");
        $('#show_correct_answer').empty()
        console.log(questions[parseInt(question_num.innerText)-1].explanation)
        let explanation = ''
        if (questions[parseInt(question_num.innerText)-1].explanation) {
            explanation = `
                <h1>Answer Explanation: <span style="text-transform: capitalize;">${questions[parseInt(question_num.innerText)-1].explanation}</span></h1>
            `
        }
        let question_answer = ''
        if (questions[parseInt(question_num.innerText)-1].answer_type === 'text') {
            question_answer = `
                ${correct_answer}
            `
        } else if (questions[parseInt(question_num.innerText)-1].answer_type === 'image') {
            question_answer = `
                <img src="${questions[parseInt(question_num.innerText)-1].correct_answer}" style="height: 75px;" alt="">
            `
        }
        $('#show_correct_answer').append(`
            <div class="question" style="height: auto;display: grid;padding-bottom: 10px;padding-top: 10px;max-width: 100% !important;align-items: center;margin-right: 40px;margin-left: 40px;">
                <h1 style="text-align: center;color: greenyellow;">Correct Answer: <span style="text-transform: capitalize;">${question_answer}</span></h1>
                ${explanation}
            </div>
        `)
    }
    // التأكد من إزالة "wrongAnswer" أو "successAnswer" من البقية
    for (let i = 1; i < 5; i++) {
        if (i !== index) {
            document.getElementById('answerCard' + i).classList.remove("successAnswer", "wrongAnswer");
        }
    }
    $.ajax({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        url : "/student/answer-question",
        data : {
            'game_id' : game_id,
            'question_id' : question_id,
            'answer': answer,
            'correct' : answer === correct_answer
        },
        type : 'POST',
        dataType : 'json',
        success : function(result){

            // console.log("===== " + parseInt(question_num.innerText) === questions.length + " =====");
            // return false
            if (answer === correct_answer) {
                localStorage.setItem("current_question", parseInt(question_num.innerText)-1)
                window.location.href = '/student/gifts/show/'+game_id;
            }
            setTimeout(function() {
                if (parseInt(question_num.innerText) !== questions.length) {
                    // console.log("===== " + result.error + " =====");

                    $('#question_data').empty()
                    // questions[parseInt(question_num.innerText)]
                    let question_image = ''
                    let question_voice_url = ''
                    let question_text = ''
                    let question1 = ''
                    let question2 = ''
                    let question3 = ''
                    let question4 = ''
                    if (questions[parseInt(question_num.innerText)].image) {
                        question_image = `
                            <div class="imgQuestion">
                                <img
                                src="${questions[parseInt(question_num.innerText)].image}"
                                alt="question-1"
                                class="questionImg"/>
                            </div>`
                    }
                    if (questions[parseInt(question_num.innerText)].voice_url) {
                        question_voice_url = `
                            <button class="musicBtnQuestion" onclick="question_voice('${questions[parseInt(question_num.innerText)].voice_url}')">
                                <img src="/assets/icons/mic.svg" alt="" width="40px"/>
                            </button>`
                    }
                    if (questions[parseInt(question_num.innerText)].question) {
                        question_text = `<h1>${questions[parseInt(question_num.innerText)].question}</h1>`
                    }
                    if (questions[parseInt(question_num.innerText)].answer_type === 'text') {
                        question1 = questions[parseInt(question_num.innerText)].answer1
                        question2 = questions[parseInt(question_num.innerText)].answer2
                        question3 = questions[parseInt(question_num.innerText)].answer3
                        question4 = questions[parseInt(question_num.innerText)].answer4
                    } else if (questions[parseInt(question_num.innerText)].answer_type === 'image') {
                        question1 = `<img src="${questions[parseInt(question_num.innerText)].answer1}" alt="">`
                        question2 = `<img src="${questions[parseInt(question_num.innerText)].answer2}" alt="">`
                        question3 = `<img src="${questions[parseInt(question_num.innerText)].answer3}" alt="">`
                        question4 = `<img src="${questions[parseInt(question_num.innerText)].answer4}" alt="">`
                    }

                    $('#question_data').append(`
                    <div class="question">
                        <div class="questionNumber"><span id="question_num">${parseInt(question_num.innerText) + 1}</span>/<span>${questions.length}</span></div>
                        <div class="questionRow">
                            ${question_voice_url}
                            ${question_text}
                            ${question_image}
                        </div>
                    </div>
                    <div class="answers">
                        <input id="question_index" hidden value="${parseInt(question_num.innerText)}">
                        <input id="question_id" hidden value="${questions[parseInt(question_num.innerText)].id}">
                        <input id="correct_answer" hidden value="${questions[parseInt(question_num.innerText)].correct_answer}">
                        <div class="answerCard" id="answerCard1" onclick="answer_hacking_question('${questions[parseInt(question_num.innerText)].answer1}', 1)">${question1}</div>
                        <div class="answerCard" id="answerCard2" onclick="answer_hacking_question('${questions[parseInt(question_num.innerText)].answer2}', 2)">${question2}</div>
                        <div class="answerCard" id="answerCard3" onclick="answer_hacking_question('${questions[parseInt(question_num.innerText)].answer3}', 3)">${question3}</div>
                        <div class="answerCard" id="answerCard4" onclick="answer_hacking_question('${questions[parseInt(question_num.innerText)].answer4}', 4)">${question4}</div>
                    </div>
                    <div id="show_correct_answer">
                    </div>
                `)
                    question_num.innerText = parseInt(question_num.innerText) + 1

                } else if (parseInt(question_num.innerText) === questions.length) {
                    window.location.href = '/student/facts/'+game_id;
                } else {
                    console.log(parseInt(question_num.innerText))
                    console.log(questions.length)
                    console.log(parseInt(question_num.innerText) !== questions.length)
                }
            },  4500);

        }
    });
}
