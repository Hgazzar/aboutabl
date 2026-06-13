<?php

namespace App\Events;

use App\Models\Student;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InteractiveGameStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $actorId;

    public string $actorType;

    public string $actorName;

    /** @var bool|int|string */
    public $status;

    public int $interactiveGameId;

    public function __construct($actor, $status, int $interactiveGameId)
    {
        $this->actorId = is_object($actor) && isset($actor->id) ? (int) $actor->id : 0;
        $this->actorType = $actor instanceof Student ? 'student' : 'user';
        $this->actorName = '';
        if (is_object($actor)) {
            $this->actorName = (string) ($actor->name ?? $actor->name_ar ?? $actor->username ?? '');
        }
        $this->status = $status;
        $this->interactiveGameId = $interactiveGameId;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('student-online.'.$this->interactiveGameId);
    }

    public function broadcastAs(): string
    {
        return 'interactive-game.status';
    }

    public function broadcastWith(): array
    {
        return [
            'actor_id' => $this->actorId,
            'actor_type' => $this->actorType,
            'name' => $this->actorName,
            'status' => $this->status,
            'interactive_game_id' => $this->interactiveGameId,
        ];
    }
}
