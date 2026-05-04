import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_page_type" AS ENUM('Article', 'Guide', 'Landing');
  CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('Article', 'Guide', 'Landing');
  CREATE TYPE "public"."enum_products_external_source" AS ENUM('raindrop', 'prismic');
  CREATE TYPE "public"."enum_products_category" AS ENUM('juguete', 'juego-de-mesa', 'libros-y-cuentos', 'cuidados', 'alimentacion', 'ropa', 'mobiliario', 'electronica', 'otros');
  CREATE TYPE "public"."enum_products_stock_status" AS ENUM('in_stock', 'out_of_stock', 'unknown');
  CREATE TYPE "public"."enum_products_disable_mode" AS ENUM('temporary', 'permanent', 'manual_review');
  CREATE TYPE "public"."enum__products_v_version_external_source" AS ENUM('raindrop', 'prismic');
  CREATE TYPE "public"."enum__products_v_version_category" AS ENUM('juguete', 'juego-de-mesa', 'libros-y-cuentos', 'cuidados', 'alimentacion', 'ropa', 'mobiliario', 'electronica', 'otros');
  CREATE TYPE "public"."enum__products_v_version_stock_status" AS ENUM('in_stock', 'out_of_stock', 'unknown');
  CREATE TYPE "public"."enum__products_v_version_disable_mode" AS ENUM('temporary', 'permanent', 'manual_review');
  CREATE TABLE "pages_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"uid" varchar,
  	"prismic_id" varchar
  );
  
  CREATE TABLE "_pages_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"uid" varchar,
  	"prismic_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "products_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "products_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"author" varchar
  );
  
  CREATE TABLE "_products_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"author" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages" ADD COLUMN "page_type" "enum_pages_page_type";
  ALTER TABLE "pages" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_page_type" "enum__pages_v_version_page_type";
  ALTER TABLE "_pages_v" ADD COLUMN "version_published_at" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "uid" varchar;
  ALTER TABLE "products" ADD COLUMN "external_source" "enum_products_external_source";
  ALTER TABLE "products" ADD COLUMN "external_id" varchar;
  ALTER TABLE "products" ADD COLUMN "source_url" varchar;
  ALTER TABLE "products" ADD COLUMN "url" varchar;
  ALTER TABLE "products" ADD COLUMN "source_name" varchar;
  ALTER TABLE "products" ADD COLUMN "name" varchar;
  ALTER TABLE "products" ADD COLUMN "store_id" integer;
  ALTER TABLE "products" ADD COLUMN "category" "enum_products_category";
  ALTER TABLE "products" ADD COLUMN "price_updated_at" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "last_sync_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "stock_status" "enum_products_stock_status" DEFAULT 'unknown';
  ALTER TABLE "products" ADD COLUMN "disable_mode" "enum_products_disable_mode";
  ALTER TABLE "products" ADD COLUMN "image_id" integer;
  ALTER TABLE "products" ADD COLUMN "raw_source_data" jsonb;
  ALTER TABLE "_products_v" ADD COLUMN "version_uid" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_external_source" "enum__products_v_version_external_source";
  ALTER TABLE "_products_v" ADD COLUMN "version_external_id" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_url" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_url" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_name" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_name" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_store_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_category" "enum__products_v_version_category";
  ALTER TABLE "_products_v" ADD COLUMN "version_price_updated_at" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_last_sync_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_stock_status" "enum__products_v_version_stock_status" DEFAULT 'unknown';
  ALTER TABLE "_products_v" ADD COLUMN "version_disable_mode" "enum__products_v_version_disable_mode";
  ALTER TABLE "_products_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_raw_source_data" jsonb;
  ALTER TABLE "stores" ADD COLUMN "uid" varchar;
  ALTER TABLE "stores" ADD COLUMN "affiliation_tag" varchar;
  ALTER TABLE "stores" ADD COLUMN "currency" varchar DEFAULT 'EUR';
  ALTER TABLE "stores" ADD COLUMN "icon_id" integer;
  ALTER TABLE "stores" ADD COLUMN "image_id" integer;
  ALTER TABLE "_stores_v" ADD COLUMN "version_uid" varchar;
  ALTER TABLE "_stores_v" ADD COLUMN "version_affiliation_tag" varchar;
  ALTER TABLE "_stores_v" ADD COLUMN "version_currency" varchar DEFAULT 'EUR';
  ALTER TABLE "_stores_v" ADD COLUMN "version_icon_id" integer;
  ALTER TABLE "_stores_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "pages_categories" ADD CONSTRAINT "pages_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_categories" ADD CONSTRAINT "_pages_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_tags" ADD CONSTRAINT "products_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_authors" ADD CONSTRAINT "products_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_tags" ADD CONSTRAINT "_products_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_authors" ADD CONSTRAINT "_products_v_version_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_categories_order_idx" ON "pages_categories" USING btree ("_order");
  CREATE INDEX "pages_categories_parent_id_idx" ON "pages_categories" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_categories_order_idx" ON "_pages_v_version_categories" USING btree ("_order");
  CREATE INDEX "_pages_v_version_categories_parent_id_idx" ON "_pages_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX "products_tags_order_idx" ON "products_tags" USING btree ("_order");
  CREATE INDEX "products_tags_parent_id_idx" ON "products_tags" USING btree ("_parent_id");
  CREATE INDEX "products_authors_order_idx" ON "products_authors" USING btree ("_order");
  CREATE INDEX "products_authors_parent_id_idx" ON "products_authors" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_tags_order_idx" ON "_products_v_version_tags" USING btree ("_order");
  CREATE INDEX "_products_v_version_tags_parent_id_idx" ON "_products_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_authors_order_idx" ON "_products_v_version_authors" USING btree ("_order");
  CREATE INDEX "_products_v_version_authors_parent_id_idx" ON "_products_v_version_authors" USING btree ("_parent_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_store_id_stores_id_fk" FOREIGN KEY ("version_store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stores" ADD CONSTRAINT "stores_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stores" ADD CONSTRAINT "stores_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stores_v" ADD CONSTRAINT "_stores_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stores_v" ADD CONSTRAINT "_stores_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "products_uid_idx" ON "products" USING btree ("uid");
  CREATE INDEX "products_external_id_idx" ON "products" USING btree ("external_id");
  CREATE UNIQUE INDEX "products_url_idx" ON "products" USING btree ("url");
  CREATE INDEX "products_store_idx" ON "products" USING btree ("store_id");
  CREATE INDEX "products_image_idx" ON "products" USING btree ("image_id");
  CREATE INDEX "_products_v_version_version_uid_idx" ON "_products_v" USING btree ("version_uid");
  CREATE INDEX "_products_v_version_version_external_id_idx" ON "_products_v" USING btree ("version_external_id");
  CREATE INDEX "_products_v_version_version_url_idx" ON "_products_v" USING btree ("version_url");
  CREATE INDEX "_products_v_version_version_store_idx" ON "_products_v" USING btree ("version_store_id");
  CREATE INDEX "_products_v_version_version_image_idx" ON "_products_v" USING btree ("version_image_id");
  CREATE UNIQUE INDEX "stores_uid_idx" ON "stores" USING btree ("uid");
  CREATE INDEX "stores_icon_idx" ON "stores" USING btree ("icon_id");
  CREATE INDEX "stores_image_idx" ON "stores" USING btree ("image_id");
  CREATE INDEX "_stores_v_version_version_uid_idx" ON "_stores_v" USING btree ("version_uid");
  CREATE INDEX "_stores_v_version_version_icon_idx" ON "_stores_v" USING btree ("version_icon_id");
  CREATE INDEX "_stores_v_version_version_image_idx" ON "_stores_v" USING btree ("version_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_authors" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_categories" CASCADE;
  DROP TABLE "_pages_v_version_categories" CASCADE;
  DROP TABLE "products_tags" CASCADE;
  DROP TABLE "products_authors" CASCADE;
  DROP TABLE "_products_v_version_tags" CASCADE;
  DROP TABLE "_products_v_version_authors" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_store_id_stores_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_image_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_store_id_stores_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_image_id_media_id_fk";
  
  ALTER TABLE "stores" DROP CONSTRAINT "stores_icon_id_media_id_fk";
  
  ALTER TABLE "stores" DROP CONSTRAINT "stores_image_id_media_id_fk";
  
  ALTER TABLE "_stores_v" DROP CONSTRAINT "_stores_v_version_icon_id_media_id_fk";
  
  ALTER TABLE "_stores_v" DROP CONSTRAINT "_stores_v_version_image_id_media_id_fk";
  
  DROP INDEX "products_uid_idx";
  DROP INDEX "products_external_id_idx";
  DROP INDEX "products_url_idx";
  DROP INDEX "products_store_idx";
  DROP INDEX "products_image_idx";
  DROP INDEX "_products_v_version_version_uid_idx";
  DROP INDEX "_products_v_version_version_external_id_idx";
  DROP INDEX "_products_v_version_version_url_idx";
  DROP INDEX "_products_v_version_version_store_idx";
  DROP INDEX "_products_v_version_version_image_idx";
  DROP INDEX "stores_uid_idx";
  DROP INDEX "stores_icon_idx";
  DROP INDEX "stores_image_idx";
  DROP INDEX "_stores_v_version_version_uid_idx";
  DROP INDEX "_stores_v_version_version_icon_idx";
  DROP INDEX "_stores_v_version_version_image_idx";
  ALTER TABLE "pages" DROP COLUMN "page_type";
  ALTER TABLE "pages" DROP COLUMN "published_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_page_type";
  ALTER TABLE "_pages_v" DROP COLUMN "version_published_at";
  ALTER TABLE "products" DROP COLUMN "uid";
  ALTER TABLE "products" DROP COLUMN "external_source";
  ALTER TABLE "products" DROP COLUMN "external_id";
  ALTER TABLE "products" DROP COLUMN "source_url";
  ALTER TABLE "products" DROP COLUMN "url";
  ALTER TABLE "products" DROP COLUMN "source_name";
  ALTER TABLE "products" DROP COLUMN "name";
  ALTER TABLE "products" DROP COLUMN "store_id";
  ALTER TABLE "products" DROP COLUMN "category";
  ALTER TABLE "products" DROP COLUMN "price_updated_at";
  ALTER TABLE "products" DROP COLUMN "last_sync_attempt_at";
  ALTER TABLE "products" DROP COLUMN "stock_status";
  ALTER TABLE "products" DROP COLUMN "disable_mode";
  ALTER TABLE "products" DROP COLUMN "image_id";
  ALTER TABLE "products" DROP COLUMN "raw_source_data";
  ALTER TABLE "_products_v" DROP COLUMN "version_uid";
  ALTER TABLE "_products_v" DROP COLUMN "version_external_source";
  ALTER TABLE "_products_v" DROP COLUMN "version_external_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_url";
  ALTER TABLE "_products_v" DROP COLUMN "version_url";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_name";
  ALTER TABLE "_products_v" DROP COLUMN "version_name";
  ALTER TABLE "_products_v" DROP COLUMN "version_store_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_category";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_updated_at";
  ALTER TABLE "_products_v" DROP COLUMN "version_last_sync_attempt_at";
  ALTER TABLE "_products_v" DROP COLUMN "version_stock_status";
  ALTER TABLE "_products_v" DROP COLUMN "version_disable_mode";
  ALTER TABLE "_products_v" DROP COLUMN "version_image_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_raw_source_data";
  ALTER TABLE "stores" DROP COLUMN "uid";
  ALTER TABLE "stores" DROP COLUMN "affiliation_tag";
  ALTER TABLE "stores" DROP COLUMN "currency";
  ALTER TABLE "stores" DROP COLUMN "icon_id";
  ALTER TABLE "stores" DROP COLUMN "image_id";
  ALTER TABLE "_stores_v" DROP COLUMN "version_uid";
  ALTER TABLE "_stores_v" DROP COLUMN "version_affiliation_tag";
  ALTER TABLE "_stores_v" DROP COLUMN "version_currency";
  ALTER TABLE "_stores_v" DROP COLUMN "version_icon_id";
  ALTER TABLE "_stores_v" DROP COLUMN "version_image_id";
  DROP TYPE "public"."enum_pages_page_type";
  DROP TYPE "public"."enum__pages_v_version_page_type";
  DROP TYPE "public"."enum_products_external_source";
  DROP TYPE "public"."enum_products_category";
  DROP TYPE "public"."enum_products_stock_status";
  DROP TYPE "public"."enum_products_disable_mode";
  DROP TYPE "public"."enum__products_v_version_external_source";
  DROP TYPE "public"."enum__products_v_version_category";
  DROP TYPE "public"."enum__products_v_version_stock_status";
  DROP TYPE "public"."enum__products_v_version_disable_mode";`)
}
