-- CreateTable
CREATE TABLE "AreaDistributionCache" (
    "cacheKey" TEXT NOT NULL,
    "entries" JSONB NOT NULL,
    "totalSpecies" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaDistributionCache_pkey" PRIMARY KEY ("cacheKey")
);

-- CreateIndex
CREATE INDEX "AreaDistributionCache_fetchedAt_idx" ON "AreaDistributionCache"("fetchedAt");
