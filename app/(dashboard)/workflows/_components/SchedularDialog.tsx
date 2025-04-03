 "use client";

import { UpdateWorkflowCron } from '@/actions/workflows/updateWorkflowCron';
import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { CalendarIcon, TriangleAlertIcon } from 'lucide-react';
import React, { useState } from 'react'
import { toast } from 'sonner';
 
export default function SchedularDialog() {
    const [cron, setCron]=useState("")

    const mutation=useMutation({
        mutationFn:UpdateWorkflowCron,
    onSuccess:()=>{
        toast.success("Schedule updated successfully",{id:"cron"})
    },
    onError:()=>{
        toast.error("Something went wrong",{id:"cron"})
    }
    })
   return (
     <Dialog>
        <DialogTrigger asChild>
            <Button variant={"link"} size={"sm"} className={cn("text-sm p-0 h-auto")}>
                <div className='flex items-centre gap-1'>
                    <TriangleAlertIcon className="h-3 w-3"/>Set schedule
                </div>
            </Button>
           
        </DialogTrigger>
        <DialogContent className='px-0'>
            <CustomDialogHeader title="Schedule workflow execution"icon={CalendarIcon}/>
        <div className='p-6 space-y-4'>
            <p className='text-muted-foreground text-sm'>
                Specify a cron expression to schedule periodic workflow execution.
                All times are in UTC
            </p>
            <Input placeholder="Eg. * * * * *" value={cron} onChange={(e)=>setCron(e.target.value)}/>
        </div>
        <DialogFooter className="px-6 gap-2">
            <DialogClose asChild>
                <Button className='w-full' variant={'secondary'}>
                    Cancel
                </Button>
            </DialogClose>
            <DialogClose asChild>
                <Button className='w-full'>Save</Button>
            </DialogClose>
        </DialogFooter>
        </DialogContent>
     </Dialog>
   )
 }
 