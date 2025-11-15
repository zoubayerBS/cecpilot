-- Proposal 4: Audit Log
CREATE TABLE cecschema.audit_log (
    id bigserial primary key,
    table_name text not null,
    record_id text not null,
    operation text not null, -- INSERT, UPDATE, DELETE
    old_data jsonb,
    new_data jsonb,
    changed_at timestamptz not null default now()
);

CREATE OR REPLACE FUNCTION cecschema.log_cec_forms_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data jsonb;
    v_new_data jsonb;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        INSERT INTO cecschema.audit_log (table_name, record_id, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'UPDATE', v_old_data, v_new_data);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        INSERT INTO cecschema.audit_log (table_name, record_id, operation, old_data)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', v_old_data);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        INSERT INTO cecschema.audit_log (table_name, record_id, operation, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', v_new_data);
        RETURN NEW;
    END IF;
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$
LANGUAGE plpgsql;

-- CREATE TRIGGER cec_forms_audit_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON cecschema.cec_forms
-- FOR EACH ROW EXECUTE FUNCTION cecschema.log_cec_forms_changes();
