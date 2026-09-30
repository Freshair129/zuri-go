BEGIN;
CREATE SCHEMA IF NOT EXISTS zuri_go;
SET search_path TO zuri_go, public;
CREATE TABLE businesses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(trim(name))>0), slug text NOT NULL UNIQUE,
 timezone text NOT NULL DEFAULT 'Asia/Bangkok', currency char(3) NOT NULL DEFAULT 'THB', week_starts_on smallint NOT NULL DEFAULT 1 CHECK(week_starts_on=1),
 archived_at timestamptz, next_campaign_no bigint NOT NULL DEFAULT 1, next_content_no bigint NOT NULL DEFAULT 1, next_task_no bigint NOT NULL DEFAULT 1,
 domain_revision bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1
);
CREATE TABLE members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), display_name text NOT NULL CHECK(length(trim(display_name))>0),
 full_name text, nickname text, team text, position text, email text, phone text, notes text, status text NOT NULL DEFAULT 'active' CHECK(status IN('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1, UNIQUE(business_id,id)
);
CREATE TABLE channel_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), platform text NOT NULL CHECK(platform IN('facebook','instagram','tiktok','line','website','other')),
 display_name text NOT NULL CHECK(length(trim(display_name))>0), external_account_id text, url text, status text NOT NULL DEFAULT 'active' CHECK(status IN('active','inactive')),
 default_freshness_hours integer NOT NULL DEFAULT 48 CHECK(default_freshness_hours>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,platform,external_account_id)
);
CREATE TABLE campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), code text NOT NULL, name text NOT NULL CHECK(length(trim(name))>0),
 objective text NOT NULL CHECK(objective IN('inventory','commerce','leads','awareness')), lifecycle text NOT NULL DEFAULT 'unconfirmed' CHECK(lifecycle IN('unconfirmed','draft','queued','active','paused','completed','cancelled')),
 owner_member_id uuid, planned_start date, planned_end date, actual_started_at timestamptz, actual_ended_at timestamptz, currency char(3) NOT NULL DEFAULT 'THB', archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,code), FOREIGN KEY(business_id,owner_member_id) REFERENCES members(business_id,id),
 CHECK(planned_end>=planned_start), CHECK(actual_ended_at>=actual_started_at), CHECK(lifecycle<>'active' OR actual_started_at IS NOT NULL), CHECK(lifecycle<>'queued' OR planned_start IS NOT NULL)
);
CREATE TABLE campaign_channels (
 business_id uuid NOT NULL REFERENCES businesses(id), campaign_id uuid NOT NULL, channel_account_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,campaign_id,channel_account_id), FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id), FOREIGN KEY(business_id,channel_account_id) REFERENCES channel_accounts(business_id,id)
);
CREATE TABLE campaign_states (
 business_id uuid NOT NULL REFERENCES businesses(id), campaign_id uuid NOT NULL, schema_version integer NOT NULL DEFAULT 1, state_json jsonb NOT NULL, payload_hash text NOT NULL,
 row_version bigint NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,campaign_id), FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id), CHECK(jsonb_typeof(state_json)='object')
);
CREATE TABLE content_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), code text NOT NULL, title text NOT NULL CHECK(length(trim(title))>0),
 description text, format text CHECK(format IN('image','video','carousel','text','other')), planning_month date NOT NULL CHECK(extract(day FROM planning_month)=1),
 campaign_id uuid, owner_member_id uuid, approval_status text NOT NULL DEFAULT 'draft' CHECK(approval_status IN('draft','in_review','changes_requested','approved')),
 approved_by_member_id uuid, approved_at timestamptz, asset_url text, archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,code), FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id),
 FOREIGN KEY(business_id,owner_member_id) REFERENCES members(business_id,id), FOREIGN KEY(business_id,approved_by_member_id) REFERENCES members(business_id,id),
 CHECK(approval_status<>'approved' OR approved_at IS NOT NULL)
);
CREATE TABLE publications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), content_item_id uuid NOT NULL, channel_account_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','scheduled','published','failed','cancelled')), scheduled_at timestamptz, published_at timestamptz,
 external_post_id text, published_url text, confirmation_note text, failure_reason text, idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,idempotency_key), UNIQUE(business_id,channel_account_id,external_post_id),
 FOREIGN KEY(business_id,content_item_id) REFERENCES content_items(business_id,id), FOREIGN KEY(business_id,channel_account_id) REFERENCES channel_accounts(business_id,id),
 CHECK(status<>'scheduled' OR scheduled_at IS NOT NULL), CHECK(status<>'published' OR (published_at IS NOT NULL AND (nullif(trim(published_url),'') IS NOT NULL OR nullif(trim(confirmation_note),'') IS NOT NULL)))
);
CREATE TABLE metric_definitions (
 code text PRIMARY KEY, label_th text NOT NULL, unit text NOT NULL, kind text NOT NULL CHECK(kind IN('stock','flow','derived_delta')), base_metric_code text REFERENCES metric_definitions(code),
 direction text NOT NULL DEFAULT 'higher_is_better' CHECK(direction IN('higher_is_better','lower_is_better')), definition_version integer NOT NULL DEFAULT 1, allows_negative boolean NOT NULL DEFAULT false, integer_only boolean NOT NULL DEFAULT true
);
INSERT INTO metric_definitions(code,label_th,unit,kind,allows_negative,integer_only) VALUES
 ('followers_total','ผู้ติดตามสะสม','บัญชี','stock',false,true),('leads','ผู้สนใจใหม่','ราย','flow',false,true),('net_revenue','รายได้สุทธิ','บาท','flow',true,false),('published_posts','รายการที่เผยแพร่','รายการ','flow',false,true);
INSERT INTO metric_definitions(code,label_th,unit,kind,base_metric_code,allows_negative) VALUES('followers_net','ผู้ติดตามเพิ่มสุทธิ','บัญชี','derived_delta','followers_total',true);
CREATE TABLE metric_series (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), metric_code text NOT NULL REFERENCES metric_definitions(code), channel_account_id uuid, campaign_id uuid,
 source_kind text NOT NULL CHECK(source_kind IN('manual','import','campaign_projection','publication_projection')), source_label text NOT NULL, freshness_hours integer NOT NULL DEFAULT 48 CHECK(freshness_hours>0), status text NOT NULL DEFAULT 'active' CHECK(status IN('active','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1, UNIQUE(business_id,id),
 UNIQUE NULLS NOT DISTINCT(business_id,metric_code,channel_account_id,campaign_id), FOREIGN KEY(business_id,channel_account_id) REFERENCES channel_accounts(business_id,id), FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id),
 CHECK(metric_code<>'followers_total' OR (channel_account_id IS NOT NULL AND campaign_id IS NULL)), CHECK(metric_code<>'followers_net')
);
CREATE TABLE metric_observations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), series_id uuid NOT NULL, effective_at timestamptz NOT NULL, period_start timestamptz,
 value numeric(20,4) NOT NULL, coverage text NOT NULL CHECK(coverage IN('complete','partial')), source_ref text NOT NULL CHECK(length(trim(source_ref))>0), collected_at timestamptz NOT NULL DEFAULT now(),
 recorded_by_member_id uuid, revision integer NOT NULL DEFAULT 1 CHECK(revision>0), supersedes_id uuid, is_current boolean NOT NULL DEFAULT true, correction_reason text, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,id), UNIQUE(business_id,series_id,effective_at,revision), FOREIGN KEY(business_id,series_id) REFERENCES metric_series(business_id,id),
 FOREIGN KEY(business_id,recorded_by_member_id) REFERENCES members(business_id,id), FOREIGN KEY(business_id,supersedes_id) REFERENCES metric_observations(business_id,id), CHECK(period_start<effective_at), CHECK(value::text NOT IN('NaN','Infinity','-Infinity'))
);
CREATE UNIQUE INDEX observation_current ON metric_observations(business_id,series_id,effective_at) WHERE is_current;
CREATE TABLE goals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), name text NOT NULL CHECK(length(trim(name))>0), metric_code text NOT NULL REFERENCES metric_definitions(code), campaign_id uuid, owner_member_id uuid,
 period_kind text NOT NULL CHECK(period_kind IN('weekly','monthly')), period_start date NOT NULL, period_end_exclusive date NOT NULL, timezone text NOT NULL DEFAULT 'Asia/Bangkok',
 target_value numeric(20,4) NOT NULL CHECK(target_value>0 AND target_value::text NOT IN('NaN','Infinity','-Infinity')), status text NOT NULL DEFAULT 'active' CHECK(status IN('draft','active','closed','archived')), change_reason text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1, UNIQUE(business_id,id),
 FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id), FOREIGN KEY(business_id,owner_member_id) REFERENCES members(business_id,id),
 CHECK((period_kind='weekly' AND extract(isodow FROM period_start)=1 AND period_end_exclusive=period_start+7) OR (period_kind='monthly' AND extract(day FROM period_start)=1 AND period_end_exclusive=(period_start+interval '1 month')::date))
);
CREATE TABLE goal_series (
 business_id uuid NOT NULL REFERENCES businesses(id), goal_id uuid NOT NULL, series_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,goal_id,series_id), FOREIGN KEY(business_id,goal_id) REFERENCES goals(business_id,id), FOREIGN KEY(business_id,series_id) REFERENCES metric_series(business_id,id)
);
CREATE TABLE tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), code text NOT NULL, title text NOT NULL CHECK(length(trim(title))>0), description text, deliverable text,
 status text NOT NULL DEFAULT 'planned' CHECK(status IN('planned','doing','blocked','review','done')), status_confirmed boolean NOT NULL DEFAULT false, due_date date, campaign_id uuid, content_item_id uuid, goal_id uuid,
 source_kind text NOT NULL DEFAULT 'manual' CHECK(source_kind IN('manual','manual-from-meeting','meeting','weekly-plan','campaign-legacy')), acceptance text, acceptance_proposed boolean NOT NULL DEFAULT false,
 evidence text, blocker text, project_label text, dependency_note text, kpi_note text, recheck_date date, source_url text, completed_at timestamptz, archived_at timestamptz,
 legacy_metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,code), FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id), FOREIGN KEY(business_id,content_item_id) REFERENCES content_items(business_id,id), FOREIGN KEY(business_id,goal_id) REFERENCES goals(business_id,id)
);
CREATE TABLE task_roles (
 business_id uuid NOT NULL REFERENCES businesses(id), task_id uuid NOT NULL, member_id uuid NOT NULL, role text NOT NULL CHECK(role IN('R','A','C','I')), confirmation text NOT NULL DEFAULT 'proposed' CHECK(confirmation IN('proposed','confirmed')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(business_id,task_id,member_id,role), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id), FOREIGN KEY(business_id,member_id) REFERENCES members(business_id,id)
);
CREATE UNIQUE INDEX single_r_a ON task_roles(business_id,task_id,role) WHERE role IN('R','A');
CREATE TABLE weekly_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), week_start date NOT NULL CHECK(extract(isodow FROM week_start)=1), timezone text NOT NULL DEFAULT 'Asia/Bangkok',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1, UNIQUE(business_id,id), UNIQUE(business_id,week_start)
);
CREATE TABLE weekly_plan_tasks (
 business_id uuid NOT NULL REFERENCES businesses(id), weekly_plan_id uuid NOT NULL, task_id uuid NOT NULL, priority text CHECK(priority IN('must','should','could','wont')), priority_note text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 PRIMARY KEY(business_id,weekly_plan_id,task_id), FOREIGN KEY(business_id,weekly_plan_id) REFERENCES weekly_plans(business_id,id), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id)
);
CREATE TABLE meetings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), campaign_id uuid, title text NOT NULL, started_at timestamptz,
 source_instance_id text NOT NULL, source_project_id text NOT NULL, source_recording_id text NOT NULL, legacy_metadata jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1, UNIQUE(business_id,id),
 UNIQUE(business_id,source_instance_id,source_project_id,source_recording_id), FOREIGN KEY(business_id,campaign_id) REFERENCES campaigns(business_id,id)
);
CREATE TABLE meeting_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), meeting_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN('source','review')), parent_revision_id uuid,
 content_hash text NOT NULL, source_revision text, source_cursor text, source_mode text, schema_version integer NOT NULL DEFAULT 1, segments jsonb NOT NULL CHECK(jsonb_typeof(segments)='array'), coverage jsonb,
 captured_at timestamptz NOT NULL, reviewed_by_member_id uuid, legacy_metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,id),
 UNIQUE NULLS NOT DISTINCT(business_id,meeting_id,kind,content_hash,parent_revision_id), FOREIGN KEY(business_id,meeting_id) REFERENCES meetings(business_id,id), FOREIGN KEY(business_id,parent_revision_id) REFERENCES meeting_revisions(business_id,id), FOREIGN KEY(business_id,reviewed_by_member_id) REFERENCES members(business_id,id)
);
CREATE TABLE meeting_draft_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), meeting_id uuid NOT NULL, review_revision_id uuid NOT NULL,
 request_id text NOT NULL, source_hash text NOT NULL, review_hash text NOT NULL, mode text NOT NULL CHECK(mode IN('local_ai','manual')), model_ref text, items jsonb NOT NULL,
 generated_at timestamptz NOT NULL, committed_at timestamptz, commit_key text, commit_payload_hash text, legacy_metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,id), UNIQUE(business_id,request_id), UNIQUE(business_id,commit_key),
 FOREIGN KEY(business_id,meeting_id) REFERENCES meetings(business_id,id), FOREIGN KEY(business_id,review_revision_id) REFERENCES meeting_revisions(business_id,id)
);
CREATE TABLE meeting_task_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), batch_id uuid NOT NULL, proposal_id text NOT NULL, task_id uuid NOT NULL, review_revision_id uuid NOT NULL, evidence jsonb NOT NULL,
 committed_at timestamptz NOT NULL DEFAULT now(), UNIQUE(business_id,id), UNIQUE(business_id,batch_id,proposal_id), FOREIGN KEY(business_id,batch_id) REFERENCES meeting_draft_batches(business_id,id), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id), FOREIGN KEY(business_id,review_revision_id) REFERENCES meeting_revisions(business_id,id)
);
CREATE TABLE ai_briefs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), period_start date NOT NULL, period_end_exclusive date NOT NULL, as_of timestamptz NOT NULL,
 input_hash text NOT NULL, prompt_version text NOT NULL, mode text NOT NULL CHECK(mode IN('ai','rule_based')), provider text, model text, status text NOT NULL CHECK(status IN('ready','failed')),
 summary jsonb NOT NULL, evidence_snapshot jsonb NOT NULL, generated_at timestamptz NOT NULL DEFAULT now(), error_code text, UNIQUE(business_id,id)
);
CREATE UNIQUE INDEX brief_cache ON ai_briefs(business_id,input_hash,prompt_version,mode) WHERE status='ready';
CREATE TABLE change_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), entity_type text NOT NULL, entity_id uuid NOT NULL, event_type text NOT NULL,
 before_data jsonb, after_data jsonb, actor_member_id uuid, actor_kind text NOT NULL CHECK(actor_kind IN('local_operator','authenticated','system','import')), actor_subject text, request_id text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,id), FOREIGN KEY(business_id,actor_member_id) REFERENCES members(business_id,id)
);
CREATE TABLE migration_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id), source_namespace uuid NOT NULL, backup_sha256 text NOT NULL, backup_schema_version integer NOT NULL,
 status text NOT NULL CHECK(status IN('validated','committed','failed')), report jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), committed_at timestamptz,
 UNIQUE(business_id,id), UNIQUE(business_id,source_namespace,backup_sha256)
);
CREATE TABLE migration_keys (
 business_id uuid NOT NULL REFERENCES businesses(id), source_namespace uuid NOT NULL, entity_type text NOT NULL, legacy_id text NOT NULL, batch_id uuid NOT NULL, new_id uuid NOT NULL, source_hash text NOT NULL,
 PRIMARY KEY(business_id,source_namespace,entity_type,legacy_id), FOREIGN KEY(business_id,batch_id) REFERENCES migration_batches(business_id,id)
);
CREATE INDEX campaign_lifecycle ON campaigns(business_id,lifecycle) WHERE archived_at IS NULL;
CREATE INDEX content_month ON content_items(business_id,planning_month,approval_status) WHERE archived_at IS NULL;
CREATE INDEX publication_schedule ON publications(business_id,scheduled_at) WHERE status='scheduled';
CREATE INDEX publication_history ON publications(business_id,published_at) WHERE status='published';
CREATE INDEX observation_latest ON metric_observations(business_id,series_id,effective_at DESC) WHERE is_current;
CREATE INDEX goal_period ON goals(business_id,period_start,period_end_exclusive,status);
CREATE INDEX task_attention ON tasks(business_id,status,due_date);
CREATE INDEX task_campaign ON tasks(business_id,campaign_id);
CREATE INDEX member_assignment ON task_roles(business_id,member_id,role);
CREATE INDEX event_history ON change_events(business_id,entity_type,entity_id,occurred_at DESC);
CREATE FUNCTION stamp_row() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); NEW.row_version=OLD.row_version+1; RETURN NEW; END $$;
DO $$ DECLARE t record; scope_column text; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='zuri_go' AND tablename<>'metric_definitions' LOOP
   scope_column=CASE WHEN t.tablename='businesses' THEN 'id' ELSE 'business_id' END;
   EXECUTE format('ALTER TABLE zuri_go.%I ENABLE ROW LEVEL SECURITY',t.tablename);
   EXECUTE format('ALTER TABLE zuri_go.%I FORCE ROW LEVEL SECURITY',t.tablename);
   EXECUTE format('CREATE POLICY business_scope ON zuri_go.%I USING (%I = nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid) WITH CHECK (%I = nullif(current_setting(''zuri_go.business_id'',true),'''')::uuid)',t.tablename,scope_column,scope_column);
   IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='zuri_go' AND table_name=t.tablename AND column_name='updated_at') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='zuri_go' AND table_name=t.tablename AND column_name='row_version') THEN
     EXECUTE format('CREATE TRIGGER stamp BEFORE UPDATE ON zuri_go.%I FOR EACH ROW EXECUTE FUNCTION zuri_go.stamp_row()',t.tablename);
   END IF;
 END LOOP;
END $$;
COMMIT;
