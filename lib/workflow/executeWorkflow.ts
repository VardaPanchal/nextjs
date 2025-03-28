import prisma from "@/lib/prisma";
import { AppNode } from "@/types/appNode";
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from "@/types/workflow";
import { ExecutionPhase } from "@prisma/client";
import { revalidatePath } from "next/cache";
import "server-only";
import { TaskRegistry } from "./task/registry";
import { waitFor } from "../helper/waitFor";
import { ExecutorRegistry } from "./executor/registry";
import { Environment, ExecutionEnvironment } from "@/types/executor";
import { TaskParamType } from "@/types/task";
import { Browser, Page } from "puppeteer";

export async function ExecuteWorkflow(executionId:string){
    const execution=await prisma.workflowExecution.findUnique({
        where:{id:executionId},
        include:{workflow:true,phases:true},
    });

    if (!execution){
        throw new Error("execution not found");
    }

    const environment:Environment={phases:{}};

    await initializeWorkflowExecution(executionId,execution.workflowId);
    await initializePhaseStatuses(execution);

    let creditsConsumed=0;
    let executionFailed=false;
    for (const phase of execution.phases){
      const phaseExecution=await executeWorkflowPhase(phase,environment);
      if (!phaseExecution.success){
        executionFailed=true;
        break;
      }
    }
    await finalizeWorkflowExecution(
        executionId,
        execution.workflowId,
        executionFailed,
        creditsConsumed
    )
    revalidatePath("/workflows/runs")
}

async function initializeWorkflowExecution(executionId:string,workflowId:string){
   await prisma.workflowExecution.update({
    where: {id :executionId },
    data:{
        startedAt:new Date(),
        status:WorkflowExecutionStatus.RUNNING

    }
});
 await prisma.workflow.update({
    where:{
        id:workflowId,
        
    },
    data:{
        lastRunAt:new Date(),
        lastRunStatus: WorkflowExecutionStatus.RUNNING,
        lastRunId:executionId
    },  

 })
}

async function initializePhaseStatuses(execution:any){
    await prisma.executionPhase.updateMany({
        where:{
            id:{
                in:execution.phases.map((phase:any)=>phase.id),
            },
        },
        data:{
            status:ExecutionPhaseStatus.PENDING,
        }
    })
}

async function finalizeWorkflowExecution(
    executionId:string,
    workflowId:string,
    executionFailed:boolean,
    creditsConsumed:number
){
    const finalStatus=executionFailed
    ? WorkflowExecutionStatus.FAILED
    : WorkflowExecutionStatus.COMPLETED;

    await prisma.workflowExecution.update({
        where:{id:executionId},
        data:{
            status:finalStatus,
            completedAt:new Date(),
            creditsConsumed,
        },
    });
    await prisma.workflow.update({
        where: {
            id:workflowId,
            lastRunId:executionId,
        },
        data:{
            lastRunStatus:finalStatus,
        },
    }).catch((err)=>{
          
    })
}

async function executeWorkflowPhase(phase: ExecutionPhase,environment:Environment){
    const startedAt=new Date();
    const node=JSON.parse(phase.node) as AppNode;
    setupEnvironmentForPhase(node,environment)

    await prisma.executionPhase.update({
        where:{id:phase.id},
        data:{
            status:ExecutionPhaseStatus.RUNNING,
            startedAt,
            inputs:JSON.stringify(environment.phases[node.id].inputs)
        }
    });
    const creditsRequired=TaskRegistry[node.data.type].credits;
    console.log(`${phase.name} with ${creditsRequired}`);

    const success= await executePhase(phase,node,environment);

    await finalizePhase(phase.id,success);
    return {success};

}

async function finalizePhase(phaseId:string,success:boolean){
    const finalStatus=success
    ? ExecutionPhaseStatus.COMPLETED
    :ExecutionPhaseStatus.FAILED;
    
    await prisma.executionPhase.update({
        where:{
            id:phaseId,
        },
        data:{
            status:finalStatus,
            completedAt:new Date(),
        }
    })
}

async function executePhase(phase:ExecutionPhase,node:AppNode,environment:Environment):Promise<boolean>{
   const runFn=ExecutorRegistry[node.data.type];
   if(!runFn){
    return false;
   }
   const ExecutionEnvironment:ExecutionEnvironment<any>=createExecutionEnvironment(node,environment);
   return await runFn(ExecutionEnvironment);   
}

function  setupEnvironmentForPhase(node:AppNode,environment:Environment){
    environment.phases[node.id] = {inputs:{},outputs:{}};
    const inputs=TaskRegistry[node.data.type].inputs;
    for (const input of inputs){
      if (input.type===TaskParamType.BROWSER_INSTANCE) continue;
      const inputValue=node.data.inputs[input.name];
      if (!inputValue){
        environment.phases[node.id].inputs[input.name]= inputValue;
        continue;
      }
    }
} 

function createExecutionEnvironment(node:AppNode,environment:Environment):ExecutionEnvironment<any>{
    return {
        getInput:(name:string)=>environment.phases[node.id]?.inputs[name],
        
        getBrowser:() => environment.browser,
        setBrowser:(browser:Browser)=>(environment.browser=browser),
    
        getPage:()=>environment.page,
        setPage:(page:Page)=>(environment.page=page),
    }
    
}