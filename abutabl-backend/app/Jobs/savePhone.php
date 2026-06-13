<?php

namespace App\Jobs;

use App\Models\Phones;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class savePhone implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $data;
    public $maxExceptions = 3;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
 
    public function handle()
    {
        foreach($this->data as $r=>$row){
            Phones::updateOrcreate([
                'phone'           => $row['phone'],
                "company"         => 'etisalat',
                "invoice_value"   => '100',
            ]);
        }
    }

}
