/*
  Warnings:

  - A unique constraint covering the columns `[scientificName]` on the table `Species` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Species_scientificName_key" ON "Species"("scientificName");
