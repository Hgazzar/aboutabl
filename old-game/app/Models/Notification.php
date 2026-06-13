<?php

namespace App\Models;

// use App\Enums\NotificationTypeEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
## initialization
    use HasFactory;

    protected $guarded = [];



    public function fromUser()
    {
        return $this->belongsTo(User::class,'from_user_id');
    }

    public function getUserImage()
    {
        if ($this->fromUser == null){
            return getFile(setting()->favicon);
        }
        else{
            return getUserImage($this->fromUser->image);
        }
    }

    public function urlToGo()
    {
        if ($this->type == NotificationTypeEnum::ServicePending->value){
            return route('site.service.edit',@$this->service->id);
        }
    }


}
