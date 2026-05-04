import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tags_type" AS ENUM('general', 'product', 'page');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "generate_slug" boolean DEFAULT false,
      "slug" varchar NOT NULL,
      "type" "enum_tags_type" DEFAULT 'general' NOT NULL,
      "description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "tags_created_at_idx" ON "tags" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "pages_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "tags_id" integer
    );

    CREATE TABLE IF NOT EXISTS "_pages_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "tags_id" integer
    );

    ALTER TABLE "products_rels" ADD COLUMN IF NOT EXISTS "tags_id" integer;
    ALTER TABLE "_products_v_rels" ADD COLUMN IF NOT EXISTS "tags_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tags_id" integer;

    CREATE INDEX IF NOT EXISTS "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "pages_rels_tags_id_idx" ON "pages_rels" USING btree ("tags_id");

    CREATE INDEX IF NOT EXISTS "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_pages_v_rels_tags_id_idx" ON "_pages_v_rels" USING btree ("tags_id");

    CREATE INDEX IF NOT EXISTS "products_rels_tags_id_idx" ON "products_rels" USING btree ("tags_id");
    CREATE INDEX IF NOT EXISTS "_products_v_rels_tags_id_idx" ON "_products_v_rels" USING btree ("tags_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");

    DO $$ BEGIN
      ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DROP TABLE IF EXISTS "products_tags" CASCADE;
    DROP TABLE IF EXISTS "_products_v_version_tags" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tags_fk";
    ALTER TABLE "_products_v_rels" DROP CONSTRAINT IF EXISTS "_products_v_rels_tags_fk";
    ALTER TABLE "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_tags_fk";
    ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_tags_fk";
    ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_parent_fk";
    ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_tags_fk";
    ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_parent_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_tags_id_idx";
    DROP INDEX IF EXISTS "_products_v_rels_tags_id_idx";
    DROP INDEX IF EXISTS "products_rels_tags_id_idx";
    DROP INDEX IF EXISTS "_pages_v_rels_tags_id_idx";
    DROP INDEX IF EXISTS "_pages_v_rels_path_idx";
    DROP INDEX IF EXISTS "_pages_v_rels_parent_idx";
    DROP INDEX IF EXISTS "_pages_v_rels_order_idx";
    DROP INDEX IF EXISTS "pages_rels_tags_id_idx";
    DROP INDEX IF EXISTS "pages_rels_path_idx";
    DROP INDEX IF EXISTS "pages_rels_parent_idx";
    DROP INDEX IF EXISTS "pages_rels_order_idx";
    DROP INDEX IF EXISTS "tags_created_at_idx";
    DROP INDEX IF EXISTS "tags_updated_at_idx";
    DROP INDEX IF EXISTS "tags_slug_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tags_id";
    ALTER TABLE "_products_v_rels" DROP COLUMN IF EXISTS "tags_id";
    ALTER TABLE "products_rels" DROP COLUMN IF EXISTS "tags_id";

    DROP TABLE IF EXISTS "_pages_v_rels";
    DROP TABLE IF EXISTS "pages_rels";
    DROP TABLE IF EXISTS "tags";

    DROP TYPE IF EXISTS "public"."enum_tags_type";
  `)
}
