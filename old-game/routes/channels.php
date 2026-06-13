<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Student;
use App\Models\User;
/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('presence-online-users.{gameId}', function ($user, $gameId) {
    return $user;
});

Broadcast::channel('student-online.{gameId}', function ($user, $gameId) {

//    $chatRoom = \App\Models\ChatRoom::find($roomId);
//    if(in_array($user->id, explode(',', $chatRoom->user_id))) {
        return $user;
//    } else {
//        return false;
//    }

});
