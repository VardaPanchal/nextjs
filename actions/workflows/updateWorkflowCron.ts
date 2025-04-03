"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
const cronParser = require('cron-parser');

export async function UpdateWorkflowCron({
  id,
  cron,
}: {
  id: string;
  cron: string;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("unauthenticated");
  }
  
  try {
    const interval = cronParser.parseExpression(cron, { utc: true });
    return await prisma.workflow.update({
      where: { id, userId },
      data: {
        cron,
        nextRunAt: interval.next().toDate(),
      }
    });
  } catch (error: any) {
    console.error(error.message);
    throw new Error("invalid cron expression");
  }
}