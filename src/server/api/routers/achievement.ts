import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const achievementRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.achievement.findMany({
      orderBy: { date: "desc" },
    });
  }),

  log: protectedProcedure
    .input(
      z.object({
        // userName is no longer needed as we use ctx.session.user
        exercise: z.string().min(1),
        value: z.number().positive(),
        date: z.string(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.achievement.create({
        data: {
          userId: ctx.session.user.id,
          exercise: input.exercise,
          value: input.value,
          date: new Date(input.date),
        },
      });
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      include: {
        goals: true,
        achievements: true,
      },
    });
    return users;
  }),
});
