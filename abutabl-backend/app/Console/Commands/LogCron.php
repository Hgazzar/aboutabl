<?php

namespace App\Console\Commands;

use App\Models\Logs;
use App\Models\Phones;
use App\Models\User;
use Illuminate\Console\Command;
use Helper;


class LogCron extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'log:cron';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        
        $checkWe = Helper::callJumia('we','0227242291');
        $lastLog = Logs::orderBy('id', 'DESC')->first();
        if($checkWe != 429)
        {
            if(isset($lastLog))
            {
                if($lastLog->block == 1 )
                {
                    Logs::create(['block' =>  0 ]);
                }
            }
            
            User::where('block','!=',0)->update(['block'=>0]); 
            $phones = Phones::where('status',2)->orderBy('created_at', 'ASC')->paginate(3); 
            foreach($phones as $phone)
            { 
                if($phone->we == '1')
                {
                    $checkWe = Helper::callJumia('we',$phone->phone);
                    if($checkWe == 200)
                    {
                        Phones::where('id',$phone->id)->update(['company' => 'we' , 'status' => 1 ]);
                        User::where('block','!=',0)->update(['block'=>0]);
                        sleep(20);
                        continue;
                    }
                }else{
                    $checkWe = "" ;
                }
    
    
                if($phone->etisalat == '1'){
                    $checkEtisalat = Helper::callJumia('etisalat',$phone->phone);
                    if($checkEtisalat == 200)
                    {
                        Phones::where('id',$phone->id)->update(['company' => 'etisalat' , 'status' => 1 ]);
                        User::where('block','!=',0)->update(['block'=> 0]);
                        sleep(6);
                        continue;
                    }
                }else{
                    $checkEtisalat = "" ;
                }
    
                if($phone->orange == '1'){
                    $checkOrange = Helper::callJumia('orange',$phone->phone);
                    if($checkOrange == 200)
                    {
                        Phones::where('id',$phone->id)->update(['company' => 'orange' , 'status' => 1 ]);
                        User::where('block','!=',0)->update(['block'=> 0]);
                        sleep(6);
                        continue;
                    }
                }else{
                    $checkOrange = "" ;
                }
                if($phone->noor == '1'){
                    $checkNoor = Helper::callJumia('noor',$phone->phone);
                    if($checkNoor == 200)
                    {
                        Phones::where('id',$phone->id)->update(['company' => 'noor' , 'status' => 1 ]);
                        User::where('block','!=',0)->update(['block'=> 0]);
                        sleep(6);
                        continue;
                    }
                }else{
                    $checkNoor = "" ;
                }
    
                if($checkWe != 200 && $checkEtisalat != 200 && $checkOrange != 200 && $checkNoor != 200 )
                {

                    $os = array($checkWe,$checkEtisalat,$checkOrange,$checkNoor);
                    if (!in_array(429,$os)) {
                        Phones::where('id',$phone->id)->update(['status' => -1 ]);
                    }else{
                        User::where('block',0)->update(['block'=> 1]);
                    }
                }
                
    
    
            }
        }else{
            if(isset($lastLog))
            {
                if($lastLog->block == 0 )
                {
                    User::where('block',0)->update(['block'=>$checkWe]);
                    $count = Phones::whereBetween('updated_at',[$lastLog->created_at,Now()])->count();
                    Logs::create([
                        'block' =>  1 ,
                        'phones'=> $count ,
                    ]);
                }
            }else{
                User::where('block',0)->update(['block'=>$checkWe]);
                $count = Phones::where('updated_at','<=',Now())->count();
                Logs::create([
                    'block' =>  1 ,
                    'phones'=> $count ,
                ]);
            }
        }
        

        return 0;
    }
}