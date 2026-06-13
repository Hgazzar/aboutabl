window._ = require('lodash');

try {
    require('bootstrap');
} catch (e) {
}

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

window.axios = require('axios');

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo';

// window.Pusher = require('pusher-js');

// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: process.env.MIX_PUSHER_APP_KEY,
//     cluster: process.env.MIX_PUSHER_APP_CLUSTER,
//     forceTLS: true
// });


import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.MIX_PUSHER_APP_KEY,
    cluster: process.env.MIX_PUSHER_APP_CLUSTER,
    wsHost: window.location.hostname,
    wsPort: 8001, //6001 , 3030
    // wssPort: 8000,
    forceTLS: false,  //false
    enabledTransports: ['ws'],// wss
    disableStats: true,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    },
});
let onlineuserslength = 0;
let anotheonlineuserslength = 0;
let game_id = document.getElementById('game_id') ?
    document.getElementById('game_id').value : 0
let game_question_count = document.getElementById('game_question_count') ?
    document.getElementById('game_question_count').value : 0
window.Echo.join(`presence-online-users.${game_id}`)
    .here((users) => {
        console.log('Online users:', users);
        $('#students_wait_list').empty();
        $('#statistics_online_students').empty();
        onlineuserslength = users.length;
        let userId = $('meta[name=user-id]').attr('content');
        let useName = $('meta[name=user-name]').attr('content');
        users.forEach(function (user, index) {
            if (user.id === Number(userId) && user.name === useName) {
                onlineuserslength--;
                return false;
            }
            $('#students_wait_list').append(`
                <div class="studentNameCard" id="student_${user.id}">
                    <img src="/assets/icons/person.svg" alt="person-icon" class="person-icon"/>
                    <h5>${user.name}</h5>
                </div>
            `)

            $('#statistics_online_students').append(`
                <tr id="statistic_student_${user.id}">
                    <td>${user.id}</td>
                    <td class="personData">
                        <img
                            src="/assets/icons/person.svg"
                            alt="person-icon"
                            class="person-icon"
                        />
                        <span>${user.name}</span>
                    </td>
                    <td class="personScore"><span id="student_answers_${user.id}">0</span>/<span>${game_question_count}</span></td>
                </tr>
            `)

            if (!user.type) {
                anotheonlineuserslength++;
                $('#another_students').append(`
                    <div class="studentCard" id="another_student_${user.id}">
                        <img src="/assets/icons/person.svg" alt="person" class="studentPerson"/>
                        <span>${user.name}</span>
                    </div>
                `)
            }

        });
        $('#students_count').text(onlineuserslength);
        $('#another_students_count').text(anotheonlineuserslength);
        // Update the UI with the list of online users
    })
    .joining((user) => {
        console.log(`joined `, user);
        onlineuserslength++;

        $('#students_count').text(onlineuserslength);

        $('#students_wait_list').append(`
            <div class="studentNameCard" id="student_${user.id}">
                <img src="/assets/icons/person.svg" alt="person-icon" class="person-icon"/>
                <h5>${user.name}</h5>
            </div>
        `)
        $('#statistics_online_students').append(`
            <tr id="statistic_student_${user.id}">
                <td>${user.id}</td>
                <td class="personData">
                    <img
                        src="/assets/icons/person.svg"
                        alt="person-icon"
                        class="person-icon"
                    />
                    <span>${user.name}</span>
                </td>
                <td class="personScore"><span id="student_answers_${user.id}">0</span>/<span>${game_question_count}</span></td>
            </tr>
        `)

        if (!user.type) {
            anotheonlineuserslength++;
            $('#another_students').append(`
                <div class="studentCard" id="another_student_${user.id}">
                    <img src="/assets/icons/person.svg" alt="person" class="studentPerson"/>
                    <span>${user.name}</span>
                </div>
            `)
            $('#another_students_count').text(anotheonlineuserslength);
        }

    })
    .leaving((user) => {
        console.log(`left `, user);
        onlineuserslength--;
        $('#students_count').text(onlineuserslength);

        $('#student_'+user.id).remove()
        $('#statistic_student_'+user.id).remove()
        if (!user.type) {
            anotheonlineuserslength--;
            $('#another_students_count').text(anotheonlineuserslength);
            $('#another_student_'+user.id).remove()
        }
    });

// let game_id = document.getElementById('game_id').value
window.Echo.private(`student-online.${game_id}`)
    .listen('UserStatusChanged', e => {
        // console.log(roomId);
        console.log(e);

        if (e.status === true){
            localStorage.removeItem("countdownEndTime");
            localStorage.removeItem("current_question");
            if (window.location.href.includes('/student/'+game_id)) {
                window.location.href = '/student/question/'+game_id;
            }
        } else {
            localStorage.removeItem("countdownEndTime");
            localStorage.removeItem("current_question");
            if (window.location.href.includes('/student/question/'+game_id)
                || window.location.href.includes('/student/gifts/show/'+game_id)
                || window.location.href.includes('/student/password_hacking/show/'+game_id)) {
                window.location.href = '/student/facts/'+game_id;
            }
        }

        if (!e.user.type) {
            let student_answer_correct = document.getElementById('student_answers_'+e.user.id)
            if (e.status === 1) {
                student_answer_correct.innerText =  parseInt(student_answer_correct.innerText) +1
            }
        }
    });
