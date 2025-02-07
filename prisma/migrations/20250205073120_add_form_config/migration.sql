-- CreateTable
CREATE TABLE "FormConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fields" JSONB NOT NULL,

    CONSTRAINT "FormConfig_pkey" PRIMARY KEY ("id")
);
