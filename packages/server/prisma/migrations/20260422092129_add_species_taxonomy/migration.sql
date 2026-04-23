-- AlterTable
ALTER TABLE "Species" ADD COLUMN     "familyScientific" TEXT,
ADD COLUMN     "order" TEXT,
ADD COLUMN     "orderScientific" TEXT;

-- CreateIndex
CREATE INDEX "Species_orderScientific_idx" ON "Species"("orderScientific");

-- CreateIndex
CREATE INDEX "Species_familyScientific_idx" ON "Species"("familyScientific");
