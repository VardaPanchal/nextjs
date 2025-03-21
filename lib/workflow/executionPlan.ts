import { AppNode } from "@/types/appNode";
import { WorkflowExecutionPlan } from "@/types/workflow";
import { Edge } from "@xyflow/react";
import { TaskRegistry } from "./task/registry";

type FlowToExecutionPlanType={
    executionPlan?:WorkflowExecutionPlan;
}
export function FlowToExecutionPlan(nodes:AppNode[],edges:Edge[]):FlowToExecutionPlanType {

const entryPoint=nodes.find((node)=>TaskRegistry[node.data.type].isEntryPoint);
    if (!entryPoint){
        throw new Error("TODO:HANDLE THIS ERROR");
    }
    const executionPlan: WorkflowExecutionPlan=[];
    return {executionPlan};
}