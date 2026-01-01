import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const achievementRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.achievement.findMany({
      orderBy: { date: "desc" },
    });
  }),

  log: publicProcedure
    .input(
      z.object({
        userName: z.string().min(1),
        exercise: z.string().min(1),
        value: z.number().positive(),
        date: z.string(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { name: input.userName },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return ctx.db.achievement.create({
        data: {
          userId: user.id,
          exercise: input.exercise,
          value: input.value,
          date: new Date(input.date),
        },
      });
    }),
    
  getStats: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      include: {
        goals: true,
        achievements: true,
      },
    });
    return users;
  }),
});
