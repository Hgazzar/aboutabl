<?php

namespace App\Http\Controllers\Api\StudentControllers;

use App\Http\Controllers\Controller;
use App\Services\Notification\NotificationInboxService;
use App\Services\Notification\NotificationUrlNormalizer;
use App\Traits\GeneralTrait;
use DB;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    use GeneralTrait;

    /** @var NotificationInboxService */
    private $inbox;

    /** @var NotificationUrlNormalizer */
    private $urls;

    public function __construct(NotificationInboxService $inbox, NotificationUrlNormalizer $urls)
    {
        auth()->setDefaultDriver('user-api');
        $this->inbox = $inbox;
        $this->urls = $urls;
    }

    public function index(Request $request)
    {
        $recipient = $this->inbox->recipientForStudent(auth()->user());

        $notifications = DB::table('notifications')
            ->leftjoin('users', 'users.id', '=', 'notifications.from_user_id')
            ->whereIn('notifications.is_read', request()->has('is_read') ? [request('is_read')] : [0, 1])
            ->where('notifications.to_user_type', $recipient['type'])
            ->where('notifications.to_user_id', $recipient['id'])
            ->take($request->limit > 0 ? $request->limit : 10000)
            ->orderBy('notifications.created_at', 'desc')
            ->select(
                'notifications.id',
                'notifications.title',
                'notifications.description',
                'notifications.is_read',
                'notifications.url',
                'from_user_id as from_id',
                'users.name',
                DB::raw("CONCAT( '".asset('/storage')."/' ,users.photo) AS photo")
            )
            ->get()
            ->map(function ($row) {
                $row->url = $this->urls->forApiResponse(
                    isset($row->url) ? (string) $row->url : null
                );

                return $row;
            });

        return response()->json([
            'status' => true,
            'notifications' => $notifications,
        ], 200);
    }

    public function update($id, Request $request)
    {
        try {
            $recipient = $this->inbox->recipientForStudent(auth()->user());
            $updated = $this->inbox->markRead($recipient, (int) $id);

            if ($updated === 0) {
                return $this->returnError('E403', __('Forbidden.'), 403);
            }

            return $this->returnSuccessMessage(__('api.Notifications Updated Successfully'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function mark_all_read(Request $request)
    {
        try {
            $recipient = $this->inbox->recipientForStudent(auth()->user());
            $this->inbox->markAllRead($recipient);

            return $this->returnSuccessMessage(__('api.Notifications Updated Successfully'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }

    public function delete_all(Request $request)
    {
        try {
            $recipient = $this->inbox->recipientForStudent(auth()->user());
            $this->inbox->deleteAll($recipient);

            return $this->returnSuccessMessage(__('api.Notifications Deleted Successfully'), '200', 200);
        } catch (\Exception $ex) {
            return $this->returnError($ex->getCode(), $ex->getMessage());
        }
    }
}
