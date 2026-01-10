import { z } from "zod";
import { hash } from "bcryptjs";
import { createTRPCRouter, unsafePublicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAll: unsafePublicProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      include: {
        goals: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  hasPassword: unsafePublicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { name: input.name },
        select: { password: true },
      });
      return !!user?.password;
    }),

  register: unsafePublicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        pin: z.string().length(4).optional(), // Pin is optional now (only for new users)
        goals: z
          .array(
            z.object({
              exercise: z.string().min(1),
              target: z.number().positive(),
              unit: z.string().min(1),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prepare update/create data
      const data: any = { name: input.name };
      if (input.pin) {
        data.password = await hash(input.pin, 10);
      }

      const user = await ctx.db.user.upsert({
        where: { name: input.name },
        update: input.pin ? { password: data.password } : {}, // Only update password if pin is provided
        create: {
          name: input.name,
          // If no pin provided on create, it's problematic for login, but maybe we allow it for migration?
          // But UI enforces it for new users.
          password: data.password,
        },
      });

      // Using createMany or a loop if we want to ensure existing ones aren't duplicated
      // but for registration we usually just add new ones.
      // To be safe against duplicates (same exercise for same user):
      for (const goal of input.goals) {
        await ctx.db.goal.upsert({
          where: {
            userId_exercise: {
              userId: user.id,
              exercise: goal.exercise,
            },
          },
          update: {
            target: goal.target,
            unit: goal.unit,
          },
          create: {
            userId: user.id,
            exercise: goal.exercise,
            target: goal.target,
            unit: goal.unit,
          },
        });
      }
      return user;
    }),
});
