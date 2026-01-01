/*
  Warnings:

  - A unique constraint covering the columns `[userId,exercise]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Goal_userId_exercise_key" ON "Goal"("userId", "exercise");
