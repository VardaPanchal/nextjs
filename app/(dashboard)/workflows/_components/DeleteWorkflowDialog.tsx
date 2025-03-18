"use client";

import { DeleteWorkflow } from "@/actions/workflows/deleteWorkflow";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface Props{
    open:boolean;
    setOpen:(open:boolean)=>void;
    workflowName:string;
}
export default function DeleteWorkflowDialog({open,setOpen,workflowName}:Props) {
    const [confirmText,setConfirmText]=useState("");
    const deleteMutation=useMutation({
        mutationFn: DeleteWorkflow,
        onSuccess: () => {},
        onError:() => {},
    });

  return (
  <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>If you delete the workflow,you won't be able to recover it.
                <div className="flex flex-col py-4 gap-2">
                    <p>If you are sure,enter <b>{workflowName}</b> to confirm:</p>
                    <Input value={confirmText} onChange={(e)=>setConfirmText(e.target.value)}/>
                </div>
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={confirmText!==workflowName || deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(e)=>{e.stopPropagation();toast.loading("Deleting workflow...")}}>Delete</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  )
}
