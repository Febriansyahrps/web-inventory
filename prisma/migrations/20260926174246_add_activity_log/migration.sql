-- CreateTable
CREATE TABLE "activity_log" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER,
    "label" TEXT NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
